import { NextApiRequest } from 'next';
import crypto from 'crypto';
import { lineConfig } from '../config/line';
import { logger } from './logger';
import { LineNotificationConfig, LineMessage, LineNotificationPayload } from '../types/lineTypes';

export function verifyLineSignature(req: NextApiRequest): boolean {
  try {
    const signature = req.headers['x-line-signature'] as string;
    
    if (!signature) {
      logger.error('缺少 Line 簽名');
      return false;
    }

    const body = JSON.stringify(req.body);
    const hash = crypto
      .createHmac('SHA256', lineConfig.channelSecret)
      .update(body)
      .digest('base64');

    return hash === signature;
  } catch (error) {
    logger.error('驗證 Line 簽名失敗', { error });
    return false;
  }
}

export function formatLineMessage(text: string, maxLength: number = 2000): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

export const LINE_CONFIG: LineNotificationConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || ''
};

export async function getTodayNews() {
  // 實作獲取今日新聞的邏輯
  // 返回新聞陣列
  return [];
}

export const sendTodayNews = async (userId: string, news: any[]) => {
  const messages = news.map(item => ({
    type: "text" as const,
    text: `${item.title}\n${item.link}`
  }));
  
  await sendLineNotification(userId, messages);
};

export async function sendNoNewsMessage(userId: string) {
  const message = {
    type: "text" as const,
    text: `感謝您的訊息！

很抱歉，本帳號無法個別回覆用戶的訊息。
敬請期待我們下次發送的內容唷 🙂`
  };

  await sendLineNotification(userId, [message]);
}

export async function sendLineNotification(userId: string, messages: LineMessage[]): Promise<boolean> {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CONFIG.channelAccessToken}`
      },
      body: JSON.stringify({
        to: userId,
        messages: messages
      })
    });

    if (!response.ok) {
      throw new Error(`LINE API responded with status: ${response.status}`);
    }

    logger.info('LINE 通知發送成功', { userId });
    return true;
  } catch (error) {
    logger.error('發送 LINE 通知失敗:', error);
    return false;
  }
}