import { NextApiRequest, NextApiResponse } from 'next';
import { DISCORD_CONFIG, DISCORD_SCOPES } from '@/config/discord';
import { logger } from '@/utils/logger';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { discordService } from '@/services/discordService';
import { discordBotService } from '@/services/discordBotService';

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

    // 添加自動加好友邏輯
    try {
      const botService = discordBotService;
      await botService.start(); // 確保 bot 已啟動
      
      // 檢查是否已經是好友
      const isFriend = await botService.checkFriendshipStatus(userData.id);
      if (!isFriend) {
        // 如果不是好友，則添加
        await botService.addFriend(userData.id);
      }

      // 發送測試訊息
      const testDmResult = await discordService.sendDirectMessage(
        userData.id,
        'TEST',
        '✨ Discord 通知功能已啟用',
        '歡迎使用 AWS Blog 365！\n\n您已成功開啟 Discord 通知功能。',
        process.env.NEXT_PUBLIC_BASE_URL || 'https://awsblog365.com/'
      );

      if (!testDmResult) {
        throw new Error('無法發送私人訊息，請確保您的 Discord 隱私設定允許接收私人訊息。');
      }
    } catch (error) {
      logger.error('Discord bot 好友添加失敗:', error);
      throw new Error('Discord 通知設定失敗，請確保您允許接收私人訊息。');
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
      <html lang="zh-TW">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Discord 授權成功</title>
        <style>
          body {
            font-family: 'Microsoft JhengHei', -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f6f6f7;
          }

          .container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
            width: 90%;
            max-width: 400px;
            text-align: center;
            padding: 32px;
            animation: fadeIn 0.5s ease-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .discord-logo {
            width: 80px;
            height: 80px;
            margin-bottom: 24px;
          }

          .success-icon {
            font-size: 48px;
            margin: 16px 0;
            animation: bounce 1s ease infinite;
          }

          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          h1 {
            color: #5865F2;
            font-size: 24px;
            margin: 0 0 16px;
            font-weight: 700;
          }

          p {
            color: #4F5660;
            font-size: 16px;
            line-height: 1.5;
            margin: 0 0 24px;
          }

          .close-button {
            background-color: #5865F2;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
            text-decoration: none;
            display: inline-block;
            margin-top: 16px;
          }

          .close-button:hover {
            background-color: #4752C4;
          }

          .countdown {
            color: #72767D;
            font-size: 14px;
            margin-top: 16px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png"
               alt="Discord Logo"
               class="discord-logo">
          <h1>Discord 授權成功</h1>
          <p>已成功綁定，請至您的 Discord 帳號查看訊息！</p>
          <div class="countdown">視窗將在 <span id="timer">2</span> 秒後關閉</div>
        </div>

        <script>
          // 倒數計時並關閉視窗
          let timeLeft = 5;
          const timerElement = document.getElementById('timer');
          const countdown = setInterval(() => {
            timeLeft--;
            if (timerElement) {
              timerElement.textContent = timeLeft;
            }
            if (timeLeft <= 0) {
              clearInterval(countdown);
              // 通知父視窗授權成功
              window.opener?.postMessage(
                { 
                  type: 'DISCORD_AUTH_SUCCESS',
                  discord_id: '${userData.id}'
                }, 
                '*'
              );
              // 關閉視窗
              window.close();
            }
          }, 1000);
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(successHtml);
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