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
    text: '感謝您加入！我們將為您提供最新的部落格更新通知。\n\n您可以輸入��驗證」或「/id」來獲取您的 LINE ID。'
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

      // 處理文字訊息
      if (event.type === 'message' && event.message.type === 'text') {
        const messageText = event.message.text;

        // 處理驗證指令
        if (messageText === '驗證' || messageText === '/id') {
          try {
            // 1. 回覆用戶的 LINE ID
            await lineService.replyMessage(event.replyToken, {
              type: 'text',
              text: `您的 LINE ID 是：${lineUserId}`
            });

            // 2. 檢查並更新好友狀態
            const followStatus = await lineService.checkFollowStatus(lineUserId);
            
            // 3. 更新資料庫
            const params = {
              TableName: "AWS_Blog_UserNotificationSettings",
              Item: {
                lineId: { S: lineUserId },
                isFollowing: { BOOL: followStatus.isFollowing },
                lineNotification: { BOOL: true },
                updatedAt: { S: new Date().toISOString() }
              }
            };

            await dynamoClient.send(new PutItemCommand(params));

            logger.info('已更新用戶 LINE 設定:', {
              lineId: lineUserId,
              isFollowing: followStatus.isFollowing
            });

          } catch (error) {
            logger.error('處理驗證指令失敗:', error);
            // 發送錯誤訊息給用戶
            await lineService.replyMessage(event.replyToken, {
              type: 'text',
              text: '處理驗證請求時發生錯誤，請稍後重試。'
            });
          }
          continue;
        }
      }
    }

    return res.status(200).json({ message: 'OK' });
    
  } catch (error) {
    logger.error('Webhook 處理失敗:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
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