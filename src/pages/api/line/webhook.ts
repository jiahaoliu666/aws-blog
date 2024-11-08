// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { verifyLineSignature } from '@/utils/lineUtils';
import { lineService } from '@/services/lineService';
import { logger } from '@/utils/logger';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { lineConfig } from '@/config/line';
import crypto from 'crypto';

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

// 添加錯誤處理中間件
const errorHandler = (error: any, res: NextApiResponse) => {
  logger.error('LINE Webhook 錯誤:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // 回傳適當的錯誤響應
  res.status(500).json({
    success: false,
    message: '處理請發生錯誤'
  });
};

// 添加驗證碼生成函數
function generateVerificationCode(length: number): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from(
    { length }, 
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

// 添加 saveVerificationInfo 函數
async function saveVerificationInfo(lineUserId: string, verificationCode: string) {
  const command = new PutItemCommand({
    TableName: 'line_verifications',
    Item: {
      lineUserId: { S: lineUserId },
      verificationCode: { S: verificationCode },
      createdAt: { S: new Date().toISOString() },
      expiresAt: { N: (Math.floor(Date.now() / 1000) + 600).toString() } // 10分鐘後過期
    }
  });

  try {
    await dynamoClient.send(command);
    logger.info('驗證資訊已儲存', { lineUserId, verificationCode });
  } catch (error) {
    logger.error('儲存驗證資訊失敗', error);
    throw error;
  }
}

// 添加驗證碼訊息模板函數
function createVerificationTemplate(code: string) {
  return {
    type: 'text',
    text: `您的驗證碼是：${code}\n請在10分鐘內完成驗證。`
  };
}

// 添加 LINE ID 訊息模板函數
function createUserIdTemplate(userId: string) {
  return {
    type: 'text',
    text: `您的 LINE ID 是：${userId}`
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 驗證 LINE 簽章
    if (!verifyLineSignature(req)) {
      logger.error('LINE Webhook 簽章驗證失敗', {
        signature: req.headers['x-line-signature'],
        body: req.body
      });
      return res.status(401).json({ message: '章驗證失敗' });
    }

    const events = req.body.events as LineWebhookEvent[];
    
    for (const event of events) {
      logger.info('收到 LINE 事件:', {
        type: event.type,
        messageType: event.message?.type,
        text: event.message?.text,
        userId: event.source.userId
      });

      if (event.type === 'message' && event.message?.type === 'text') {
        const messageText = event.message.text;
        logger.info('收到文字訊息:', {
          text: messageText,
          userId: event.source.userId
        });

        if (messageText === '驗證') {
          try {
            const lineUserId = event.source.userId;
            if (!lineUserId) {
              throw new Error('無法獲取用戶 LINE ID');
            }

            // 生成驗證碼
            const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();
            
            // 儲存驗證資訊
            await saveVerificationInfo(lineUserId, verificationCode);

            // 發送兩個訊息：LINE ID 和驗證碼
            await lineService.replyMessage(event.replyToken!, [
              createUserIdTemplate(lineUserId),
              createVerificationTemplate(verificationCode)
            ]);

            logger.info('驗證訊息發送成功', {
              lineUserId,
              verificationCode
            });
          } catch (error) {
            logger.error('驗證處理失敗', {
              error: error instanceof Error ? error.message : '未知錯誤',
              userId: event.source.userId
            });
            
            // 發送錯誤訊息
            if (event.replyToken) {
              await lineService.replyMessage(event.replyToken, [{
                type: 'text',
                text: '驗證處理失敗，請稍後重試'
              }]);
            }
          }
        }
      }
    }

    res.status(200).json({ message: 'OK' });
  } catch (error) {
    errorHandler(error, res);
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