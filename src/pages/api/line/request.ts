import { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '../../../utils/logger';
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 確保 Redis 連接
  if (!redis.isOpen) {
    logger.info('正在連接 Redis...');
    await redis.connect();
    logger.info('Redis 連接成功');
  }

  if (req.method !== 'POST') {
    logger.warn('收到非 POST 請求', { method: req.method });
    return res.status(405).json({ error: '僅支援 POST 請求' });
  }

  const { lineId, userId } = req.body;
  logger.info('收到 LINE 驗證請求', { lineId, userId, timestamp: new Date().toISOString() });

  try {
    if (!lineId || !userId) {
      logger.error('缺少必要參數', { lineId, userId, timestamp: new Date().toISOString() });
      return res.status(400).json({ error: '缺少必要參數' });
    }

    // 生成驗證碼
    const verificationCode = Math.random().toString(36).substring(2, 8);
    logger.info('生成驗證碼', { verificationCode, userId, timestamp: new Date().toISOString() });

    // 儲存驗證碼到 Redis
    const redisKey = `line_verify:${userId}`;
    logger.info('準備儲存驗證碼到 Redis', { redisKey, userId, timestamp: new Date().toISOString() });
    
    await redis.setEx(redisKey, 300, JSON.stringify({
      code: verificationCode,
      lineId,
      timestamp: Date.now()
    }));
    logger.info('驗證碼成功儲存到 Redis', { redisKey, userId, timestamp: new Date().toISOString() });

    // 發送驗證訊息到 LINE
    logger.info('準備發送 LINE 驗證訊息', { lineId, userId, timestamp: new Date().toISOString() });
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
      logger.error('LINE 訊息發送失敗', { 
        error,
        lineId,
        userId,
        status: messageResponse.status,
        statusText: messageResponse.statusText,
        timestamp: new Date().toISOString()
      });
      return res.status(500).json({ error: 'LINE 訊息發送失敗' });
    }

    logger.info('LINE 驗證訊息發送成功', { 
      lineId, 
      userId, 
      verificationCode,
      timestamp: new Date().toISOString()
    });
    res.status(200).json({ success: true });

  } catch (error) {
    logger.error('處理驗證請求時發生錯誤', { 
      error: error instanceof Error ? error.message : '未知錯誤',
      stack: error instanceof Error ? error.stack : undefined,
      lineId,
      userId,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: '內部伺服器錯誤' });
  }
} 