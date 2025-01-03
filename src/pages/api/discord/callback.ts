import { NextApiRequest, NextApiResponse } from 'next';
import { DISCORD_CONFIG, DISCORD_SCOPES } from '@/config/discord';
import { logger } from '@/utils/logger';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { discordService } from '@/services/discordService';

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

  if (typeof userId !== 'string') {
    throw new Error('無效的 userId');
  }

  try {
    logger.info('開始處理 Discord 回調:', { code, state: req.query.state });

    // 繼續原有的 token 交換流程
    const tokenParams = new URLSearchParams({
      client_id: DISCORD_CONFIG.CLIENT_ID,
      client_secret: DISCORD_CONFIG.CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code as string,
      redirect_uri: DISCORD_CONFIG.REDIRECT_URI,
      scope: DISCORD_SCOPES.join(' ')
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

    // 驗證是否可以發送私人訊息
    try {
      const testDmResult = await discordService.sendDirectMessage(
        userData.id,
        'TEST',
        '✨ Discord 通知功能已啟用',
        '歡迎使用 AWS Blog 365！\n\n您已成功開啟 Discord 通知功能。',
        process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      );

      if (!testDmResult) {
        throw new Error('無法發送私人訊息，請確保您的 Discord 隱私設定允許接收私人訊息，且未封鎖機器人。');
      }
    } catch (error) {
      logger.error('測試發送私人訊息失敗:', error);
      throw new Error('Discord 通知測試失敗，請確保您已開啟接收私人訊息的權限。如果問題持續存在，請檢查是否已封鎖機器人。');
    }

    // 更新用戶的 Discord 設定
    const updateParams = {
      TableName: "AWS_Blog_UserNotificationSettings",
      Key: {
        userId: { S: userId as string }
      },
      UpdateExpression: "SET discordId = :did, discordNotification = :dn, updatedAt = :ua",
      ExpressionAttributeValues: {
        ":did": { S: userData.id },
        ":dn": { BOOL: true },
        ":ua": { S: new Date().toISOString() }
      }
    };

    await dynamoClient.send(new UpdateItemCommand(updateParams));

    // 返回成功 HTML 頁面
    const successHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Discord 授權成功</title>
        <script>
          window.opener.postMessage({
            type: 'DISCORD_AUTH_SUCCESS',
            discord_id: '${userData.id}',
            username: '${userData.username}',
            discriminator: '${userData.discriminator}',
            avatar: '${userData.avatar || ''}'
          }, '*');
          
          // 倒數計時功能
          let countdown = 5;
          const timer = setInterval(() => {
            countdown--;
            document.getElementById('countdown').textContent = countdown;
            if (countdown <= 0) {
              clearInterval(timer);
              window.close();
            }
          }, 1000);
        </script>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f9fafb;
          }
          .container {
            background-color: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            text-align: center;
            max-width: 90%;
            width: 400px;
          }
          .icon {
            font-size: 3rem;
            color: #5865F2;
            margin-bottom: 1rem;
          }
          .title {
            color: #111827;
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }
          .message {
            color: #6B7280;
            font-size: 1rem;
            margin-bottom: 1.5rem;
          }
          .countdown {
            background-color: #5865F2;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }
          .pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: .5;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✨</div>
          <h1 class="title">Discord 授權成功</h1>
          <p class="message">已成功連結，請至您的 Discord 帳號查看訊息！</p>
          <div class="countdown">
            <span>視窗將在</span>
            <span id="countdown" class="pulse">5</span>
            <span>秒後關閉</span>
          </div>
        </div>
      </body>
      </html>
    `;

    return res.status(200).send(successHtml);
  } catch (error) {
    logger.error('Discord 回調處理失敗:', error);
    
    // 返回錯誤 HTML 頁面
    const errorMessage = error instanceof Error ? error.message : '授權過程發生錯誤';
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Discord 授權失敗</title>
        <script>
          window.opener.postMessage({
            type: 'DISCORD_AUTH_ERROR',
            error: '${errorMessage}'
          }, '*');
          
          let countdown = 5;
          const timer = setInterval(() => {
            countdown--;
            document.getElementById('countdown').textContent = countdown;
            if (countdown <= 0) {
              clearInterval(timer);
              window.close();
            }
          }, 1000);
        </script>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f9fafb;
          }
          .container {
            background-color: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            text-align: center;
            max-width: 90%;
            width: 400px;
          }
          .icon {
            font-size: 3rem;
            color: #EF4444;
            margin-bottom: 1rem;
          }
          .title {
            color: #111827;
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }
          .message {
            color: #6B7280;
            font-size: 1rem;
            margin-bottom: 1.5rem;
          }
          .error-text {
            color: #EF4444;
            font-size: 0.875rem;
            margin-bottom: 1.5rem;
            padding: 0.75rem;
            background-color: #FEE2E2;
            border-radius: 0.5rem;
          }
          .countdown {
            background-color: #6B7280;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }
          .pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: .5;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">❌</div>
          <h1 class="title">Discord 授權失敗</h1>
          <p class="message">很抱歉，授權過程發生錯誤</p>
          <div class="error-text">${errorMessage}</div>
          <div class="countdown">
            <span>視窗將在</span>
            <span id="countdown" class="pulse">5</span>
            <span>秒後關閉</span>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return res.status(500).send(errorHtml);
  }
} 