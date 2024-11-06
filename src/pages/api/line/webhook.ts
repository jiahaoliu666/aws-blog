// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { lineService } from '../../../services/lineService';
import { logger } from '../../../utils/logger';

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
        const text = event.message.text;
        const lineUserId = event.source.userId;

        // 處理驗證指令
        if (text.startsWith('驗證 ')) {
          const userId = text.split(' ')[1];
          const verificationCode = await lineService.generateVerificationCode(userId, lineUserId);
          
          await lineService.sendMessage(lineUserId, 
            `您的驗證碼是：${verificationCode}\n請在網站上輸入此驗證碼完成綁定。\n驗證碼將在5分鐘後失效。`
          );
        }
      }
    }

    res.status(200).json({ message: 'OK' });
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