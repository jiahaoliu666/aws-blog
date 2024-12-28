import { NextApiRequest, NextApiResponse } from 'next';
import { DISCORD_CONFIG, DISCORD_SCOPES } from '@/config/discord';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/utils/errorHandler';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 同時接受 GET 和 POST 請求
    if (req.method !== 'GET' && req.method !== 'POST') {
      return res.status(405).json({ success: false, message: '方法不允許' });
    }

    logger.info('收到 Discord 授權請求');
    
    // 檢查 Discord 配置
    logger.debug('檢查 Discord 配置狀態');
    if (!DISCORD_CONFIG.isConfigValid()) {
      logger.error('Discord 配置無效');
      return res.status(503).json({ 
        success: false, 
        message: 'Discord 服務暫時無法使用'
      });
    }

    // 確保 userId 被正確傳遞
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少必要參數 userId' 
      });
    }

    // 構建授權 URL
    const scope = DISCORD_SCOPES.join(' ');

    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${
      DISCORD_CONFIG.CLIENT_ID
    }&redirect_uri=${encodeURIComponent(
      DISCORD_CONFIG.REDIRECT_URI
    )}&response_type=code&scope=${scope}&state=${encodeURIComponent(userId)}`;

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