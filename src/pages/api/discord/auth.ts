import { NextApiRequest, NextApiResponse } from 'next';
import { DISCORD_CONFIG, DISCORD_SCOPES } from '@/config/discord';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/utils/errorHandler';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    logger.info('收到 Discord 授權請求');
    
    if (req.method !== 'GET') {
      logger.warn('收到非 GET 請求:', req.method);
      return res.status(405).json({ success: false, message: '方法不允許' });
    }

    // 檢查 Discord 配置
    logger.debug('檢查 Discord 配置狀態');
    if (!DISCORD_CONFIG.isConfigValid()) {
      logger.error('Discord 配置無效，配置狀態:', {
        clientId: !!DISCORD_CONFIG.CLIENT_ID,
        clientSecret: !!DISCORD_CONFIG.CLIENT_SECRET,
        botToken: !!DISCORD_CONFIG.BOT_TOKEN,
        guildId: !!DISCORD_CONFIG.GUILD_ID
      });
      
      return res.status(503).json({ 
        success: false, 
        message: 'Discord 服務暫時無法使用',
        details: '配置驗證失敗'
      });
    }

    const scope = DISCORD_SCOPES.join(' ');
    logger.debug('構建授權 URL，scope:', scope);
    
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${
      DISCORD_CONFIG.CLIENT_ID
    }&redirect_uri=${encodeURIComponent(
      DISCORD_CONFIG.REDIRECT_URI
    )}&response_type=code&scope=${scope}`;

    logger.info('生成 Discord 授權 URL 成功');
    logger.debug('授權 URL:', authUrl);

    return res.status(200).json({ 
      success: true, 
      authUrl 
    });
  } catch (error) {
    logger.error('生成 Discord 授權 URL 失敗:', error);
    return res.status(500).json(errorHandler.handle(error));
  }
} 