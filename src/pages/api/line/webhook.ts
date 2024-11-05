// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { lineService } from '../../../services/lineService';
import { logger } from '../../../utils/logger';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 開發環境特殊處理
  if (process.env.NODE_ENV === 'development') {
    console.log('開發環境：webhook 事件模擬');
    return res.status(200).json({ message: 'Webhook received (development)' });
  }

  // 生產環境的完整處理邏輯
  if (!verifyLineSignature(req)) {
    return res.status(401).json({ message: '無效的簽名' });
  }

  const events = req.body.events;
  
  for (const event of events) {
    switch (event.type) {
      case 'follow':
        // 用戶追蹤時的處理
        await lineService.handleFollow(event.source.userId);
        break;
        
      case 'unfollow':
        // 用戶取消追蹤時的處理
        await lineService.handleUnfollow(event.source.userId);
        break;
    }
  }

  res.status(200).json({ message: 'OK' });
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