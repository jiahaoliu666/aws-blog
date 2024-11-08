// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { lineService } from '../../../services/lineService';
import { logger } from '../../../utils/logger';
import { DynamoDBClient, UpdateItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import crypto from 'crypto';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

// 在 lineService 中定義返回類型
interface VerificationResult {
  success: boolean;
  verificationCode: string;
}

// 添加 LINE ID 訊息模板函數
function createUserIdTemplate(lineUserId: string) {
  return {
    type: 'text' as const,
    text: `您的 LINE ID 是：${lineUserId}`
  };
}

// 添加驗證碼訊息模板函數
function createVerificationTemplate(verificationCode: string) {
  return {
    type: 'text' as const,
    text: `您的驗證碼是：${verificationCode}\n請在網站上輸入此驗證碼完成驗證。`
  };
}

// 添加歡迎訊息模板函數
function createWelcomeTemplate() {
  return {
    type: 'text' as const,
    text: '感謝您加入！我們將為您提供最新的部落格更新通知。\n\n您可以輸入驗證」或「/id」來獲取您的 LINE ID。'
  };
}

function verifyLineSignature(req: NextApiRequest): boolean {
  const signature = req.headers['x-line-signature'] as string;
  const channelSecret = process.env.LINE_CHANNEL_SECRET as string;
  
  const body = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
    
  return signature === hash;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 驗證 LINE 請求簽名
  if (!verifyLineSignature(req)) {
    return res.status(401).json({ error: '未授權的請求' });
  }

  try {
    const events = req.body.events;
    
    for (const event of events) {
      const lineUserId = event.source.userId;

      if (event.type === 'follow') {
        // 發送歡迎訊息
        await lineService.sendMessage(lineUserId, createWelcomeTemplate());
      } else if (event.type === 'message' && event.message?.type === 'text') {
        const text = event.message.text;
        
        if (text === '驗證') {
          // 生成驗證碼
          const verificationCode = generateVerificationCode();
          
          // 儲存驗證資訊
          await saveVerificationInfo(lineUserId, verificationCode);
          
          // 發送 LINE ID 和驗證碼
          await lineService.sendMessage(lineUserId, createVerificationTemplate(verificationCode));
        }
      }
    }

    res.status(200).json({ message: 'OK' });
  } catch (error) {
    logger.error('處理 webhook 事件失敗:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// 生成驗證碼
function generateVerificationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// 儲存驗證資訊
async function saveVerificationInfo(lineId: string, verificationCode: string) {
  const params = {
    TableName: 'AWS_Blog_UserNotificationSettings',
    Item: {
      lineId: { S: lineId },
      verificationCode: { S: verificationCode },
      verificationExpiry: { N: String(Date.now() + 5 * 60 * 1000) }, // 5分鐘後過期
      updatedAt: { S: new Date().toISOString() }
    }
  };

  const command = new PutItemCommand(params);
  await dynamoClient.send(command);
}

// 設定請求大小限制
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
};