// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { lineService } from '../../../services/lineService';
import { logger } from '../../../utils/logger';
import { DynamoDBClient, UpdateItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const events = req.body.events;
    
    for (const event of events) {
      // 處理加入好友事件
      if (event.type === 'follow') {
        const lineUserId = event.source.userId;
        await lineService.updateFollowerStatus(lineUserId, true);
        await lineService.sendWelcomeMessage(lineUserId);
      }
      
      // 處理取消追蹤事件
      if (event.type === 'unfollow') {
        const lineUserId = event.source.userId;
        await lineService.updateFollowerStatus(lineUserId, false);
      }

      // 處理文字訊息
      if (event.type === 'message' && event.message.type === 'text') {
        const messageText = event.message.text;
        const lineUserId = event.source.userId;

        // 處理驗證命令
        if (messageText.startsWith('驗證')) {
          try {
            // 從訊息中提取用戶ID
            const verificationMatch = messageText.match(/驗證\s+(\S+)/);
            const userIdFromMessage = verificationMatch?.[1];

            if (!userIdFromMessage) {
                await lineService.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '❌ 驗證格式錯誤！請使用「驗證 {您的用戶ID}」格式'
                });
                return;
            }

            // 儲存到 DynamoDB
            const params = {
                TableName: "AWS_Blog_UserNotificationSettings",
                Item: {
                    userId: { S: userIdFromMessage },
                    lineId: { S: lineUserId },
                    lineNotification: { BOOL: true },
                    isVerified: { BOOL: true },
                    updatedAt: { S: new Date().toISOString() }
                }
            };

            await dynamoClient.send(new PutItemCommand(params));

            // 回覆用戶
            await lineService.replyMessage(event.replyToken, {
                type: 'text',
                text: '✅ 已確認您的驗證請求！\n請回到網頁繼續完成驗證流程。'
            });

          } catch (error) {
            logger.error('儲存 LINE 設定失敗:', error);
            await lineService.replyMessage(event.replyToken, {
              type: 'text',
              text: '❌ 驗證過程發生錯誤，請稍後重試。'
            });
          }
        }
      }
    }

    res.status(200).end();
  } catch (error) {
    logger.error('處理 webhook 失敗:', error);
    res.status(500).json({ message: '處理失敗' });
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