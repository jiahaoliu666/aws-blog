// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { lineService } from '../../../services/lineService';
import { logger } from '../../../utils/logger';
import crypto from 'crypto';
import { createUserIdTemplate } from '../../../templates/lineTemplates';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('收到 LINE Webhook 請求:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  // 開發環境特殊處理
  if (process.env.NODE_ENV === 'development') {
    console.log('開發環境：webhook 事件模擬');
    return res.status(200).json({ message: 'Webhook received (development)' });
  }

  // 驗證 LINE 簽名
  if (!verifyLineSignature(req)) {
    console.error('LINE 簽名驗證失敗');
    return res.status(401).json({ message: '無效的簽名' });
  }

  try {
    const events = req.body.events;
    console.log('處理 LINE 事件:', events);
    
    for (const event of events) {
      try {
        switch (event.type) {
          case 'follow':
            console.log('處理追蹤事件', { userId: event.source.userId });
            await lineService.checkFollowStatus(event.source.userId);
            break;
            
          case 'unfollow':
            console.log('處理取消追蹤事件', { userId: event.source.userId });
            // 暫時移除 handleUnfollow 的呼叫，因為 lineService 中尚未實作此方法
            break;

          case 'message':
            if (event.message.type === 'text' && event.message.text === '/id') {
                const userIdMessage = createUserIdTemplate(event.source.userId);
                await lineService.sendMessage(event.source.userId, userIdMessage);
            }
            break;

          default:
            console.log('未處理的事件類型', { type: event.type });
        }
      } catch (error) {
        console.error('處理 LINE 事件時發生錯誤:', error);
        return res.status(500).json({ message: '內部伺服器錯誤' });
      }
    }

    res.status(200).json({ message: 'OK' });
  } catch (error) {
    console.error('處理 webhook 請求時發生錯誤:', error);
    return res.status(500).json({ message: '內部伺服器錯誤' });
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