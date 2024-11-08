// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyLineSignature } from '@/utils/lineUtils';
import { lineService } from '@/services/lineService';
import { logger } from '@/utils/logger';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { lineConfig } from '@/config/line';

// 添加 LINE Webhook 事件類型定義
type LineWebhookEvent = {
  type: string;
  message?: {
    type: string;
    text?: string;
  };
  source: {
    userId: string;
  };
  replyToken?: string;
};

const dynamoClient = new DynamoDBClient({ 
  region: 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 驗證 LINE 簽章
    if (!verifyLineSignature(req)) {
      logger.error('LINE Webhook 簽章驗證失敗', {
        signature: req.headers['x-line-signature'],
        body: req.body
      });
      return res.status(401).json({ message: '簽章驗證失敗' });
    }

    const events = req.body.events as LineWebhookEvent[];
    
    for (const event of events) {
      logger.info('收到 LINE 事件:', {
        type: event.type,
        messageType: event.message?.type,
        text: event.message?.text,
        userId: event.source.userId
      });

      if (event.type === 'message' && 
          event.message?.type === 'text' && 
          event.message.text === '驗證') {
        
        try {
          // 生成驗證碼
          const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          const lineId = event.source.userId;
          const expiryTime = Date.now() + 300000; // 5分鐘後過期

          // 儲存驗證資訊
          const params = {
            TableName: 'AWS_Blog_UserNotificationSettings',
            Item: {
              lineId: { S: lineId },
              verificationCode: { S: verificationCode },
              verificationExpiry: { N: expiryTime.toString() },
              isVerified: { BOOL: false },
              createdAt: { S: new Date().toISOString() }
            }
          };

          logger.info('準備儲存驗證資訊:', params);
          await dynamoClient.send(new PutItemCommand(params));

          // 回傳驗證資訊給用戶
          const message = {
            type: 'text',
            text: `您的驗證資訊：\n\nLINE ID：${lineId}\n驗證碼：${verificationCode}\n\n請在網站的驗證表單中輸入以上資訊。\n\n⚠️ 驗證碼將在 5 分鐘後失效`
          };

          logger.info('準備發送驗證訊息:', { lineId, verificationCode });
          await lineService.replyMessage(event.replyToken!, message);
          
          logger.info('驗證訊息發送成功');
        } catch (error) {
          logger.error('處理驗證請求時發生錯誤:', {
            error,
            event,
            stack: (error as Error).stack
          });

          // 發送錯誤訊息給用戶
          await lineService.replyMessage(event.replyToken!, {
            type: 'text',
            text: '驗證處理失敗，請稍後重試。如果問題持續發生，請聯繫客服。'
          });
        }
      }
    }

    res.status(200).json({ message: 'OK' });
  } catch (error) {
    logger.error('處理 LINE Webhook 時發生錯誤:', {
      error,
      stack: (error as Error).stack
    });
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