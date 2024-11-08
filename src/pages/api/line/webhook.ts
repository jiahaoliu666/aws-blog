// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@line/bot-sdk';
import { lineConfig } from '@/config/line';
import { verifyLineSignature } from '@/utils/lineUtils';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';
import { lineService } from '@/services/lineService';

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
async function saveVerificationInfo(userId: string, verificationCode: string) {
  const params = {
    TableName: 'line-verification',
    Item: {
      userId: { S: userId },
      verificationCode: { S: verificationCode },
      createdAt: { N: Date.now().toString() }
    }
  };

  try {
    await dynamoClient.send(new PutItemCommand(params));
  } catch (error) {
    logger.error('儲存驗證資訊失敗:', error);
    throw error;
  }
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
    // 1. 添加請求日誌
    logger.info('收到 LINE Webhook 請求', {
      body: req.body,
      headers: req.headers
    });

    // 2. 驗證簽章
    if (!verifyLineSignature(req)) {
      logger.error('LINE 簽章驗證失敗');
      return res.status(401).json({ error: '無效的簽章' });
    }

    const events = req.body.events;
    
    // 3. 處理文字訊息事件
    for (const event of events) {
      if (event.type === 'message' && 
          event.message?.type === 'text' && 
          event.message.text.trim() === '驗證') {
        
        const userId = event.source.userId;
        const replyToken = event.replyToken;

        try {
            // 生成驗證碼
            const verificationCode = generateVerificationCode();
            
          // 儲存驗證資訊
            await saveVerificationInfo(userId, verificationCode);
            
            // 使用 lineTemplates 建立回覆訊息
            const verificationMessage = createVerificationTemplate(verificationCode);
            
            // 發送回覆
            await lineService.replyMessage(replyToken, [verificationMessage]);
            
        } catch (error) {
            logger.error('處理驗證請求失敗:', error);
        }
      }
    }

    res.status(200).json({ message: 'OK' });
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