// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyLineSignature } from '@/utils/lineUtils';
import { lineService } from '@/services/lineService';
import { logger } from '@/utils/logger';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { LineWebhookEvent } from '@/types/lineTypes';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  // 驗證 LINE 簽章
  if (!verifyLineSignature(req)) {
    logger.error('LINE Webhook 簽章驗證失敗');
    return res.status(401).json({ message: '簽章驗證失敗' });
  }

  try {
    const events = req.body.events as LineWebhookEvent[];
    
    for (const event of events) {
      // 處理加入好友事件
      if (event.type === 'follow') {
        await lineService.sendWelcomeMessage(event.source.userId);
      }
      
      // 處理文字訊息事件
      if (event.type === 'message' && 
          event.message?.type === 'text' && 
          event.message.text === '驗證') {
        
        const lineId = event.source.userId;
        const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        // 儲存驗證資訊到 DynamoDB
        const params = {
          TableName: 'AWS_Blog_UserNotificationSettings',
          Item: {
            lineId: { S: lineId },
            verificationCode: { S: verificationCode },
            verificationExpiry: { N: (Date.now() + 300000).toString() }, // 5分鐘過期
            isVerified: { BOOL: false },
            isFollowing: { BOOL: true },
            createdAt: { S: new Date().toISOString() },
            updatedAt: { S: new Date().toISOString() }
          }
        };

        await dynamoClient.send(new PutItemCommand(params));

        // 回傳驗證資訊
        await lineService.replyMessage(event.replyToken!, {
          type: 'text',
          text: `您的 LINE ID: ${lineId}\n驗證碼: ${verificationCode}\n\n請將以上資訊複製到網站的驗證表單中。`
        });

        logger.info('已發送驗證資訊', { lineId, verificationCode });
      }
    }

    res.status(200).json({ message: 'OK' });
  } catch (error) {
    logger.error('處理 LINE Webhook 時發生錯誤:', error);
    res.status(500).json({ message: '內部伺服器錯誤' });
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