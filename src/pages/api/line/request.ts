import { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '../../../utils/logger';
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 確保 Redis 連接
  if (!redis.isOpen) {
    await redis.connect();
  }

  if (req.method !== 'POST') {
    logger.warn('收到非 POST 請求', { method: req.method });
    return res.status(405).json({ error: '僅支援 POST 請求' });
  }

  const { lineId, userId } = req.body;
  logger.info('收到 LINE 驗證請求', { lineId, userId });

  try {
    if (!lineId || !userId) {
      logger.error('缺少必要參數', { lineId, userId });
      return res.status(400).json({ error: '缺少必要參數' });
    }

    // 生成驗證碼
    const verificationCode = Math.random().toString(36).substring(2, 8);
    logger.info('生成驗證碼', { verificationCode });

    // 儲存驗證碼到 Redis
    const redisKey = `line_verify:${userId}`;
    logger.info('儲存驗證碼到 Redis', { redisKey });
    await redis.setEx(redisKey, 300, JSON.stringify({
      code: verificationCode,
      lineId,
      timestamp: Date.now()
    }));

    // 發送驗證訊息到 LINE
    logger.info('準備發送 LINE 驗證訊息');
    const messageResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        to: lineId,
        messages: [{
          type: 'text',
          text: `您的驗證碼是: ${verificationCode}\n請在5分鐘內完成驗證。`
        }]
      })
    });

    if (!messageResponse.ok) {
      const error = await messageResponse.json();
      logger.error('LINE 訊息發送失敗', { error });
      return res.status(500).json({ error: 'LINE 訊息發送失敗' });
    }

    logger.info('LINE 驗證訊息發送成功');
    res.status(200).json({ success: true });

  } catch (error) {
    logger.error('處理驗證請求時發生錯誤', { error });
    res.status(500).json({ error: '內部伺服器錯誤' });
  }
} 