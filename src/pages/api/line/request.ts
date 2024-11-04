import { NextApiRequest, NextApiResponse } from 'next';
import { lineConfig } from '../../../config/line';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允許' });
  }

  try {
    const { userId, lineId } = req.body;

    if (!userId || !lineId) {
      return res.status(400).json({ error: '缺少必要參數' });
    }

    // 發送驗證碼到用戶的 LINE
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineConfig.channelAccessToken}`
      },
      body: JSON.stringify({
        to: lineId,
        messages: [{
          type: 'text',
          text: `您的驗證碼是: ${generateVerificationCode()}`
        }]
      })
    });

    if (!response.ok) {
      throw new Error('發送驗證碼失敗');
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('處理驗證請求時發生錯誤:', error);
    res.status(500).json({ error: '內部伺服器錯誤' });
  }
}

function generateVerificationCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
} 