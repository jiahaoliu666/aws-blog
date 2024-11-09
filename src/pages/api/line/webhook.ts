// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@line/bot-sdk';
import { lineConfig } from '@/config/line';
import { verifyLineSignature } from '@/utils/lineUtils';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';
import { lineService } from '@/services/lineService';

enum VerificationStep {
  VERIFYING = 'VERIFYING',
  COMPLETED = 'COMPLETED'
}

enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  EXPIRED = 'EXPIRED'
}

const client = new Client({
  channelAccessToken: lineConfig.channelAccessToken,
  channelSecret: lineConfig.channelSecret,
});

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

// 生成6位數隨機驗證碼
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 儲存驗證資訊到 DynamoDB
async function saveVerificationInfo(lineId: string, verificationCode: string) {
  const params = {
    TableName: 'AWS_Blog_UserNotificationSettings',
    Item: {
      lineId: { S: lineId },
      verificationCode: { S: verificationCode },
      verificationExpiry: { N: (Date.now() + 10 * 60 * 1000).toString() }, // 10分鐘後過期
      verificationStep: { S: VerificationStep.VERIFYING },
      verificationStatus: { S: VerificationStatus.PENDING },
      createdAt: { S: new Date().toISOString() }
    }
  };

  await dynamoClient.send(new PutItemCommand(params));
}

// 創建用戶 ID 訊息模板
function createUserIdTemplate(userId: string) {
  return {
    type: 'text',
    text: `您的 Line ID 是：${userId}`
  };
}

// 創建驗證碼訊息模板
function createVerificationTemplate(code: string) {
  return {
    type: 'text',
    text: `您的驗證碼是：${code}`
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 驗證 LINE 簽章
    if (!verifyLineSignature(req)) {
      logger.error('LINE 簽章驗證失敗');
      return res.status(401).json({ error: '無效的簽章' });
    }

    const events = req.body.events;
    for (const event of events) {
      // 添加日誌追蹤
      logger.info('收到 LINE 事件:', { event });

      if (event.type === 'follow') {
        // 處理加入好友事件
        await client.pushMessage(event.source.userId, {
          type: 'text',
          text: '歡迎加入！請在聊天室中輸入「驗證」取得您的 LINE ID 和驗證碼。'
        });
      }

      if (event.type === 'message' && 
          event.message?.type === 'text' && 
          event.message.text.trim() === '驗證') {
        
        const userId = event.source.userId;
        const verificationCode = generateVerificationCode();
        
        // 儲存驗證資訊到 DynamoDB
        await saveVerificationInfo(userId, verificationCode);
        
        // 回傳 LINE ID 和驗證碼
        await client.replyMessage(event.replyToken, [
          {
            type: 'text',
            text: `您的 LINE ID 是：${userId}`
          },
          {
            type: 'text',
            text: `您的驗證碼是：${verificationCode}\n請在 5 分鐘內完成驗證。`
          }
        ]);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Webhook 處理失敗:', error);
    res.status(500).json({ error: '內部伺服器錯誤' });
  }
}

// 設定請求大小限制
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
};