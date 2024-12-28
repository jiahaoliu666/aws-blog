import { NextApiRequest, NextApiResponse } from 'next';
import { discordService } from '@/services/discordService';
import { updateUserDiscordSettings } from '@/services/userService';
import { logger } from '@/utils/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    const { userId, discordId } = req.body;

    if (!userId || !discordId) {
      return res.status(400).json({ message: '缺少必要參數' });
    }

    // 1. 驗證 Discord ID
    const isValid = await discordService.verifyDiscordId(discordId);

    if (!isValid) {
      return res.status(400).json({ message: 'Discord ID 驗證失敗' });
    }

    // 2. 獲取用戶 Discord 資訊
    const discordUser = await discordService.getUserInfo(discordId);
    
    if (!discordUser) {
      return res.status(400).json({ message: '無法獲取 Discord 用戶資訊' });
    }

    // 3. 更新用戶的 Discord 設定
    await updateUserDiscordSettings(userId, {
      discordId,
      discordUsername: discordUser.username,
      discordDiscriminator: discordUser.discriminator
    });

    return res.status(200).json({
      success: true,
      discordId,
      discordUser
    });
  } catch (error) {
    logger.error('Discord 驗證失敗:', error);
    return res.status(500).json({ message: '伺服器錯誤' });
  }
} 