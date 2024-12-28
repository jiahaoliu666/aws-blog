import { NextApiRequest, NextApiResponse } from 'next';
import { DISCORD_CONFIG } from '@/config/discord';
import { logger } from '@/utils/logger';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code, state: userId } = req.query;

  if (!code || !userId) {
    return res.status(400).json({ 
      message: '缺少必要參數',
      code: code ? true : false,
      userId: userId ? true : false
    });
  }

  // 在更新 DynamoDB 之前先檢查 userId
  if (typeof userId !== 'string') {
    throw new Error('無效的 userId');
  }

  try {
    logger.info('開始處理 Discord 回調:', { code, state: req.query.state });

    // 先檢查現有的 webhooks
    const webhooksResponse = await fetch(
      `${DISCORD_CONFIG.API_ENDPOINT}/guilds/${DISCORD_CONFIG.GUILD_ID}/webhooks`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_CONFIG.BOT_TOKEN}`,
        },
      }
    );

    if (!webhooksResponse.ok) {
      throw new Error('無法獲取 webhooks 列表');
    }

    const webhooks = await webhooksResponse.json();
    
    // 如果已經達到限制，刪除最舊的 webhook
    if (webhooks.length >= 15) {
      const oldestWebhook = webhooks[0];
      await fetch(
        `${DISCORD_CONFIG.API_ENDPOINT}/webhooks/${oldestWebhook.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bot ${DISCORD_CONFIG.BOT_TOKEN}`,
          },
        }
      );
    }

    // 繼續原有的 token 交換流程
    const tokenParams = new URLSearchParams({
      client_id: DISCORD_CONFIG.CLIENT_ID,
      client_secret: DISCORD_CONFIG.CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code as string,
      redirect_uri: DISCORD_CONFIG.REDIRECT_URI,
    });

    logger.debug('Token 請求參數:', tokenParams.toString());

    const tokenResponse = await fetch(DISCORD_CONFIG.TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      logger.error('獲取訪問令牌失敗:', tokenData);
      throw new Error(tokenData.error_description || '獲取訪問令牌失敗');
    }

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

    // 直接更新 DynamoDB
    const params = {
      TableName: "AWS_Blog_UserNotificationSettings",
      Key: {
        userId: { S: userId }
      },
      UpdateExpression: `
        SET discordNotification = :discordNotification,
            discordId = :discordId,
            updatedAt = :updatedAt,
            lineNotification = if_not_exists(lineNotification, :defaultLineNotification),
            emailNotification = if_not_exists(emailNotification, :defaultEmailNotification)
      `,
      ExpressionAttributeValues: {
        ':discordNotification': { BOOL: true },
        ':discordId': { S: userData.id },
        ':updatedAt': { S: new Date().toISOString() },
        ':defaultLineNotification': { BOOL: false },
        ':defaultEmailNotification': { BOOL: false }
      }
    };

    const command = new UpdateItemCommand(params);
    await dynamoClient.send(command);

    logger.info('Discord 設定已更新:', {
      userId: req.query.state,
      discordId: userData.id,
      discordNotification: true
    });

    // 構建授權成功的 HTML 回應
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
        setTimeout(() => window.close(), 3000);
      </script>
    </head>
    <body>
      <p>授權成功，視窗將在 3 秒後關閉...</p>
    </body>
    </html>
    `;

    return res.status(200).send(html);

  } catch (error) {
    logger.error('Discord 回調處理失敗:', error);
    const errorMessage = error instanceof Error ? error.message : '授權過程發生錯誤';
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Discord 授權失敗</title>
        <script>
          window.opener.postMessage({
            type: 'DISCORD_AUTH_ERROR',
            error: '${errorMessage}'
          }, '*');
          setTimeout(() => window.close(), 3000);
        </script>
      </head>
      <body>
        <p>授權失敗：${errorMessage}</p>
        <p>視窗將在 3 秒後關閉...</p>
      </body>
      </html>
    `;
    return res.status(500).send(errorHtml);
  }
} 