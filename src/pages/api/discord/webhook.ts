import { NextApiRequest, NextApiResponse } from 'next';
import { discordService } from '@/services/discordService';
import { DISCORD_CONFIG } from '@/config/discord';
import { logger } from '@/utils/logger';
import { DISCORD_MESSAGE_TEMPLATES } from '@/config/discord';
import { DiscordNotificationType } from '@/types/discordTypes';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    const { type, title, content, link, userId } = req.body;
    
    // 確保 type 是有效的通知類型
    const notificationType = type as DiscordNotificationType;
    
    if (!type || !title || !content || !link || !userId) {
      return res.status(400).json({ message: '缺少必要參數' });
    }

    // 發送 Discord 通知
    const success = await discordService.sendNotification(
      DISCORD_CONFIG.WEBHOOK_URL,
      notificationType,
      title,
      content,
      link
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