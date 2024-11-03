// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { WebhookEvent } from '@line/bot-sdk';
import { lineService } from '../../../services/lineService';
import { verifyLineSignature } from '@/utils/lineUtils';
import { logger } from '../../../utils/logger';
import { getTodayNews, sendTodayNews, sendLineNotification } from '@/utils/lineUtils';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  try {
    // 驗證請求
    if (!verifyLineSignature(req)) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const events: WebhookEvent[] = req.body.events;
    
    await Promise.all(events.map(async (event) => {
      try {
        switch (event.type) {
          case 'message':
            if (event.message.type === 'text') {
              const text = event.message.text.toLowerCase();
              if (text === 'today news') {
                // 獲取今日最新文章
                const todayNews = await getTodayNews();
                if (!event.source.userId) {
                  logger.error('找不到使用者 ID');
                  return;
                }
                
                if (todayNews.length > 0) {
                  await sendTodayNews(event.source.userId, todayNews);
                } else {
                  await sendNoNewsMessage(event.source.userId);
                }
              }
            }
            break;
          case 'follow':
            if (!event.source.userId) {
              logger.error('找不到使用者 ID');
              break;
            }
            
            // 1. 發送歡迎訊息
            await sendWelcomeMessage(event.source.userId);
            
            // 2. 更新資料庫 - 簡化版本
            try {
              const params = {
                TableName: 'AWS_Blog_UserNotificationSettings',
                Item: {
                  lineUserId: { S: event.source.userId },
                  lineNotification: { BOOL: true },
                  followStatus: { S: 'active' }
                }
              };

              await dynamoClient.send(new PutItemCommand(params));
              logger.info('用戶追蹤資訊已更新到資料庫', { 
                lineUserId: event.source.userId 
              });
            } catch (dbError) {
              logger.error('更新資料庫失敗', { 
                error: dbError, 
                lineUserId: event.source.userId 
              });
            }
            break;
          case 'unfollow':
            if (!event.source.userId) {
              logger.error('找不到使用者 ID');
              break;
            }

            // 更新資料庫 - 簡化版本
            try {
              const params = {
                TableName: 'AWS_Blog_UserNotificationSettings',
                Item: {
                  lineUserId: { S: event.source.userId },
                  lineNotification: { BOOL: false },
                  followStatus: { S: 'inactive' }
                }
              };

              await dynamoClient.send(new PutItemCommand(params));
              logger.info('用戶取消追蹤資訊已更新到資料庫', { 
                lineUserId: event.source.userId 
              });
            } catch (dbError) {
              logger.error('更新資料庫失敗', { 
                error: dbError, 
                lineUserId: event.source.userId 
              });
            }
            break;
          default:
            logger.info('未處理的事件類型', { eventType: event.type });
        }
      } catch (error) {
        logger.error('處理 Line 事件失敗', { error, event });
      }
    }));

    res.status(200).end();
  } catch (error) {
    logger.error('Webhook 處理失敗', { error });
    res.status(500).end();
  }
}

async function sendWelcomeMessage(userId: string) {
  const messages = [
    {
      type: "text" as const,
      text: `感謝您追蹤 AWS Blog 365！
您的 LINE 帳號已成功驗證 ✅
未來將透過 LINE 為您推送最新 AWS 文章。`
    },
    {
      type: "text" as const,
      text: `💡 小提醒：
• 您可以隨時在個人設定頁面調整通知偏好
• 輸入 "today news" 可查看今日最新文章
• 若有任何問題，歡迎隨時與我們聯繫`
    }
  ];

  await sendLineNotification(userId, messages);
}

async function sendNoNewsMessage(userId: string) {
  const message = {
    type: "text" as const,
    text: "抱歉，目前沒有最新的文章。"
  };
  
  await sendLineNotification(userId, [message]);
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
};