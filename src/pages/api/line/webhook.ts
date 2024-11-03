// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { WebhookEvent } from '@line/bot-sdk';
import { lineService } from '../../../services/lineService';
import { verifyLineSignature } from '@/utils/lineUtils';
import { logger } from '../../../utils/logger';

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
          case 'follow':
            if (!event.source.userId) {
              throw new Error('Missing userId in follow event');
            }
            await lineService.handleFollow(event.source.userId);
            break;
          case 'unfollow':
            if (!event.source.userId) {
              throw new Error('Missing userId in unfollow event');
            }
            await lineService.handleUnfollow(event.source.userId);
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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
};