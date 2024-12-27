import { NextApiRequest, NextApiResponse } from 'next';
import { DISCORD_CONFIG } from '@/config/discord';
import { discordBotService } from '@/services/discordBotService';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/utils/errorHandler';
import { updateUserDiscordSettings } from '@/services/userService';

export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: '缺少授權碼' });
  }

  try {
    // 交換授權碼獲取訪問令牌
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CONFIG.CLIENT_ID,
        client_secret: DISCORD_CONFIG.CLIENT_SECRET,
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: DISCORD_CONFIG.REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      throw new Error(error.error_description || '獲取訪問令牌失敗');
    }

    const tokenData = await tokenResponse.json();

    // 使用訪問令牌獲取用戶信息
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('獲取用戶信息失敗');
    }

    const userData = await userResponse.json();

    // 更新用戶的 Discord 設定
    await updateUserDiscordSettings(req.query.state as string, {
      discordId: userData.id,
      discordUsername: userData.username,
      discordDiscriminator: userData.discriminator
    });

    // 構建授權成功的 HTML 回應，並傳遞更多用戶資訊
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Discord 授權成功</title>
      <script>
        window.opener.postMessage({
          type: 'DISCORD_AUTH_SUCCESS',
          discord_id: '${userData.id}',
          username: '${userData.username}',
          discriminator: '${userData.discriminator}',
          avatar: '${userData.avatar || ''}'
        }, '*');
        window.close();
      </script>
    </head>
    <body>
      <p>授權成功，請稍候...</p>
    </body>
    </html>
    `;

    return res.status(200).send(html);

  } catch (error) {
    logger.error('Discord 授權失敗:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
      code: 'DISCORD_AUTH_ERROR'
    });
  }
} 