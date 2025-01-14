import { NextApiRequest, NextApiResponse } from 'next';
import { DISCORD_CONFIG } from '@/config/discord';
import { discordService } from '@/services/discordService';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/utils/errorHandler';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    const { notificationType, title, content, link } = req.body;

    if (!notificationType || !title || !content || !link) {
      return res.status(400).json({ message: '缺少必要參數' });
    }

    // 從 DynamoDB 獲取所有啟用通知的用戶
    const users = await discordService.getActiveDiscordUsers();
    
    // 向每個用戶發送私人訊息
    for (const user of users) {
      try {
        await discordService.sendDirectMessage(
          user.discordId,
          notificationType,
          title,
          content,
          link
        );
      } catch (error) {
        logger.error(`向用戶 ${user.discordId} 發送通知失敗:`, error);
      }
    }

    return res.status(200).json({ message: '通知發送成功' });
  } catch (error) {
    logger.error('發送 Discord 通知失敗:', error);
    return res.status(500).json(errorHandler.handle(error));
  }
} 