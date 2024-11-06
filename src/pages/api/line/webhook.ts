// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { lineService } from '../../../services/lineService';
import { logger } from '../../../utils/logger';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'development') {
    return res.status(200).json({ message: 'Webhook received (development)' });
  }

  if (!verifyLineSignature(req)) {
    return res.status(401).json({ message: '無效的簽章' });
  }

  try {
    const events = req.body.events;
    
    for (const event of events) {
      if (event.type === 'follow') {
        await lineService.broadcastMessage({
          type: 'text',
          text: '感謝您訂閱我們的文章更新！我們會在有新文章時第一時間通知您 🎉'
        });
      }
    }

    return res.status(200).json({ message: 'OK' });
  } catch (error) {
    logger.error('Webhook 處理失敗:', error);
    return res.status(500).json({ message: '處理 webhook 時發生錯誤' });
  }
}

function verifyLineSignature(req: NextApiRequest): boolean {
  const signature = req.headers['x-line-signature'];
  const body = JSON.stringify(req.body);
  const channelSecret = process.env.LINE_CHANNEL_SECRET || '';
  
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
    
  return signature === hash;
}

// 設定請求大小限制
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
};