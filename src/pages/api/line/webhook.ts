// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { lineService } from '../../../services/lineService';
import { logger } from '../../../utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const { events } = req.body;

    for (const event of events) {
      const { type, source } = event;

      switch (type) {
        case 'follow':
          await lineService.handleFollow(source.userId, source.userId);
          break;
        case 'unfollow':
          await lineService.handleUnfollow(source.userId);
          break;
      }
    }

    res.status(200).json({ message: 'OK' });
  } catch (error) {
    logger.error('處理 webhook 事件時發生錯誤:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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