import { NextApiRequest, NextApiResponse } from 'next';
import { DISCORD_CONFIG } from '@/config/discord';
import { discordBotService } from '@/services/discordBotService';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/utils/errorHandler';

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
    const tokenResponse = await fetch(`${DISCORD_CONFIG.API_ENDPOINT}/oauth2/token`, {
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
        scope: 'identify email guilds.join webhook.incoming'
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error('獲取訪問令牌失敗');
    }

    // 獲取用戶信息
    const userResponse = await fetch(`${DISCORD_CONFIG.API_ENDPOINT}/users/@me`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    // 將用戶加入指定的 Discord 伺服器
    await fetch(`${DISCORD_CONFIG.API_ENDPOINT}/guilds/${DISCORD_CONFIG.GUILD_ID}/members/${userData.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${DISCORD_CONFIG.BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: tokenData.access_token,
      }),
    });

    // 為用戶創建專屬的 Webhook
    const webhookUrl = await discordBotService.createWebhook(
      DISCORD_CONFIG.NOTIFICATION_CHANNEL_ID,
      `notification-${userData.id}`
    );

    // 儲存 Webhook URL 到資料庫
    // ... 實作儲存邏輯 ...

    res.redirect(
      `/profile?discord_auth=success&discord_id=${userData.id}&webhook_url=${encodeURIComponent(webhookUrl)}`
    );
  } catch (error) {
    const result = errorHandler.handle(error);
    return res.status(result.success ? 200 : 500).json(result);
  }
} 