import { NextApiRequest, NextApiResponse } from 'next';
import { discordService } from '@/services/discordService';
import { DISCORD_CONFIG } from '@/config/discord';
import { logger } from '@/utils/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    const { type, title, content, userId } = req.body;

    if (!type || !title || !content || !userId) {
      return res.status(400).json({ message: '缺少必要參數' });
    }

    // 發送 Discord 通知
    const success = await discordService.sendNotification(
      DISCORD_CONFIG.WEBHOOK_URL,
      type,
      title,
      content
    );

    if (!success) {
      throw new Error('發送 Discord 通知失敗');
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Discord Webhook 處理失敗:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
} 