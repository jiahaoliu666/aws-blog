// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { WebhookEvent } from '@line/bot-sdk';
import { lineService } from '../../../services/lineService';
import { verifyLineSignature } from '@/utils/lineUtils';
import { logger } from '../../../utils/logger';
import { getTodayNews, sendTodayNews, sendLineNotification } from '@/utils/lineUtils';

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
            await sendWelcomeMessage(event.source.userId);
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
  const message = {
    type: "text" as const,
    text: `Hao 您好！
我是AWS Blog 365。
感謝您加入好友 🤗

此官方帳號將定期發放最新資訊
給您 ❤️
敬請期待 🎁 🎪`
  };

  await sendLineNotification(userId, [message]);
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