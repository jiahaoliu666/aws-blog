import { NextApiRequest, NextApiResponse } from 'next';
import { DISCORD_CONFIG } from '@/config/discord';
import { logger } from '@/utils/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: '缺少必要參數 userId' });
    }

    if (!DISCORD_CONFIG.isConfigValid()) {
      throw new Error('Discord 配置無效');
    }

    // 生成授權 URL
    const authUrl = `${DISCORD_CONFIG.AUTHORIZE_URL}&state=${encodeURIComponent(userId)}`;
    
    logger.info('生成 Discord 授權 URL:', { userId, authUrl });
    
    return res.status(200).json({ 
      success: true,
      url: authUrl 
    });
  } catch (error) {
    logger.error('生成 Discord 授權 URL 失敗:', error);
    return res.status(500).json({ 
      success: false,
      message: '生成授權 URL 失敗' 
    });
  }
} 