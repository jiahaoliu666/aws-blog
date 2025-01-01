import { DISCORD_CONFIG, DISCORD_MESSAGE_TEMPLATES } from '@/config/discord';
import { logger } from '@/utils/logger';
import { GetItemCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DiscordNotificationType } from '@/types/discordTypes';

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
}

export class DiscordService {
  private static instance: DiscordService;
  private retryCount: number = 0;
  private dbClient: DynamoDBClient;

  private constructor() {
    this.dbClient = new DynamoDBClient({ region: 'ap-northeast-1' });
  }

  public static getInstance(): DiscordService {
    if (!DiscordService.instance) {
      DiscordService.instance = new DiscordService();
    }
    return DiscordService.instance;
  }

  // 驗證 Discord ID
  public async verifyDiscordId(discordId: string): Promise<boolean> {
    try {
      if (!DISCORD_CONFIG.BOT_TOKEN) {
        throw new Error('Discord Bot Token 未設置');
      }

      const response = await fetch(
        `${DISCORD_CONFIG.API_ENDPOINT}/users/${discordId}`,
        {
          headers: {
            Authorization: `Bot ${DISCORD_CONFIG.BOT_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        logger.error('Discord ID 驗證失敗:', error);
        return false;
      }

      const user = await response.json();
      return Boolean(user.id);
    } catch (error) {
      logger.error('Discord ID 驗證過程發生錯誤:', error);
      return false;
    }
  }

  // 發送 Discord 通知
  public async sendNotification(
    webhookUrl: string,
    type: DiscordNotificationType,
    title: string,
    content: string,
    link: string,
    discordId?: string
  ): Promise<boolean> {
    try {
      // 1. 發送到文字頻道
      const channelSuccess = await this.sendWebhookMessage(
        webhookUrl,
        type,
        title,
        content,
        link
      );

      // 2. 如果有提供 discordId，也發送到私人收件匣
      let dmSuccess = true;
      if (discordId) {
        dmSuccess = await this.sendDirectMessage(
          discordId,
          type,
          title,
          content,
          link
        );
      }

      return channelSuccess && dmSuccess;
    } catch (error) {
      logger.error('發送 Discord 通知失敗:', error);
      return false;
    }
  }

  // 新增私有的重試方法
  private async sendNotificationWithRetry(
    webhookUrl: string,
    type: 'ANNOUNCEMENT' | 'NEWS' | 'SYSTEM', 
    title: string,
    content: string,
    link: string,
    attempt: number = 1
  ): Promise<boolean> {
    try {
      // 驗證 webhook URL
      if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
        logger.error('無效的 Discord Webhook URL');
        return false;
      }

      // 先檢查 webhook 是否有效
      const checkResponse = await fetch(webhookUrl);
      if (!checkResponse.ok) {
        logger.error('Discord webhook 不存在或已失效');
        return false;
      }

      const messageTemplate = DISCORD_MESSAGE_TEMPLATES.NOTIFICATION[type as keyof typeof DISCORD_MESSAGE_TEMPLATES.NOTIFICATION];
      if (!messageTemplate) {
        logger.error(`找不到對應的消息模板: ${type}`);
        return false;
      }

      const message = messageTemplate(title, content, link);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      // 處理各種錯誤情況
      if (!response.ok) {
        const errorData = await response.json();
        
        // 處理速率限制
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter && attempt < DISCORD_CONFIG.RATE_LIMIT.MAX_RETRIES) {
            await new Promise(resolve => 
              setTimeout(resolve, parseInt(retryAfter) * 1000)
            );
            return this.sendNotificationWithRetry(
              webhookUrl, 
              type, 
              title, 
              content, 
              link, 
              attempt + 1
            );
          }
        }

        // 處理無效的 webhook
        if (response.status === 404) {
          logger.error('Discord webhook 不存在或已失效');
          return false;
        }

        throw new Error(`Discord API 錯誤: ${errorData.message || '未知錯誤'}`);
      }

      return true;
    } catch (error) {
      logger.error(`發送 Discord 通知失敗 (嘗試 ${attempt}/${DISCORD_CONFIG.RATE_LIMIT.MAX_RETRIES}):`, error);
      
      if (attempt < DISCORD_CONFIG.RATE_LIMIT.MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendNotificationWithRetry(
          webhookUrl, 
          type, 
          title, 
          content, 
          link, 
          attempt + 1
        );
      }
      
      return false;
    }
  }

  // 取得用戶 Discord 資訊
  public async getUserInfo(discordId: string): Promise<DiscordUser | null> {
    try {
      const response = await fetch(`${DISCORD_CONFIG.API_ENDPOINT}/users/${discordId}`, {
        headers: {
          Authorization: `Bot ${DISCORD_CONFIG.BOT_TOKEN}`
        }
      });

      if (!response.ok) {
        throw new Error('獲取 Discord 用戶資訊失敗');
      }

      return await response.json();
    } catch (error) {
      logger.error('獲取 Discord 用戶資訊失敗:', error);
      return null;
    }
  }

  public async exchangeCodeForToken(code: string): Promise<any> {
    try {
      const tokenParams = new URLSearchParams({
        client_id: DISCORD_CONFIG.CLIENT_ID,
        client_secret: DISCORD_CONFIG.CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: DISCORD_CONFIG.REDIRECT_URI,
      });

      const response = await fetch(DISCORD_CONFIG.TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenParams,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_description || '獲取訪問令牌失敗');
      }

      return await response.json();
    } catch (error) {
      logger.error('交換訪問令牌失敗:', error);
      throw error;
    }
  }

  public async testWebhook(): Promise<boolean> {
    try {
      const testMessage = {
        content: "測試 Discord Webhook 連接",
        username: "AWS Blog 365",
        avatar_url: "https://aws-blog-avatar.s3.ap-northeast-1.amazonaws.com/bot-avatar.png"
      };

      const response = await fetch(DISCORD_CONFIG.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testMessage)
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('Webhook 測試失敗:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Webhook 測試過程發生錯誤:', error);
      return false;
    }
  }

  public async createWebhookForUser(accessToken: string, channelId: string): Promise<string> {
    try {
      // 使用用戶的 access token 創建 webhook
      const response = await fetch(
        `${DISCORD_CONFIG.API_ENDPOINT}/channels/${DISCORD_CONFIG.NOTIFICATION_CHANNEL_ID}/webhooks`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${DISCORD_CONFIG.BOT_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'AWS Blog 365 Notifications',
            avatar: 'https://aws-blog-avatar.s3.ap-northeast-1.amazonaws.com/bot-avatar.png'
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`創建 webhook 失敗: ${error.message}`);
      }

      const webhook = await response.json();
      return `https://discord.com/api/webhooks/${webhook.id}/${webhook.token}`;
    } catch (error) {
      logger.error('創建 Discord webhook 失敗:', error);
      throw error;
    }
  }

  public async sendNotificationToUser(
    userId: string,
    type: DiscordNotificationType,
    title: string,
    content: string,
    link: string
  ): Promise<boolean> {
    try {
      const params = {
        TableName: "AWS_Blog_UserNotificationSettings",
        Key: {
          userId: { S: userId }
        },
        ProjectionExpression: "webhookUrl"
      };

      const result = await this.dbClient.send(new GetItemCommand(params));
      const webhookUrl = result.Item?.webhookUrl?.S;

      if (!webhookUrl) {
        logger.error(`用戶 ${userId} 沒有有效的 webhook URL`);
        return false;
      }

      return await this.sendNotification(webhookUrl, type, title, content, link);
    } catch (error) {
      logger.error(`發送通知給用戶 ${userId} 失敗:`, error);
      return false;
    }
  }

  public async validateWebhook(webhookUrl: string): Promise<boolean> {
    try {
      // 首先檢查 URL 格式
      if (!webhookUrl.match(/^https:\/\/discord\.com\/api\/webhooks\/\d+\/.+$/)) {
        logger.error('無效的 Discord Webhook URL 格式');
        return false;
      }

      // 發送測試請求
      const response = await fetch(webhookUrl);
      
      if (response.status === 404) {
        logger.error('Discord webhook 不存在或已失效');
        return false;
      }

      return response.ok;
    } catch (error) {
      logger.error('驗證 webhook 失敗:', error);
      return false;
    }
  }

  // 在 DiscordService 類中新增發送私人訊息的方法
  public async sendDirectMessage(
    discordId: string,
    type: DiscordNotificationType,
    title: string,
    content: string,
    link: string
  ): Promise<boolean> {
    try {
      if (!DISCORD_CONFIG.BOT_TOKEN) {
        throw new Error('Discord Bot Token 未設置');
      }

      // 1. 先建立 DM 頻道
      const createDMResponse = await fetch(
        `${DISCORD_CONFIG.API_ENDPOINT}/users/@me/channels`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bot ${DISCORD_CONFIG.BOT_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            recipient_id: discordId
          })
        }
      );

      if (!createDMResponse.ok) {
        throw new Error('無法建立私人訊息頻道');
      }

      const dmChannel = await createDMResponse.json();

      // 2. 使用訊息模板
      const messageTemplate = DISCORD_MESSAGE_TEMPLATES.NOTIFICATION[type];
      if (!messageTemplate) {
        throw new Error(`找不到對應的消息模板: ${type}`);
      }

      const message = messageTemplate(title, content, link);

      // 3. 發送訊息到 DM 頻道
      const sendMessageResponse = await fetch(
        `${DISCORD_CONFIG.API_ENDPOINT}/channels/${dmChannel.id}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bot ${DISCORD_CONFIG.BOT_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        }
      );

      if (!sendMessageResponse.ok) {
        throw new Error('發送私人訊息失敗');
      }

      return true;
    } catch (error) {
      logger.error('發送 Discord 私人訊息失敗:', error);
      return false;
    }
  }

  private async sendWebhookMessage(
    webhookUrl: string,
    type: DiscordNotificationType,
    title: string,
    content: string,
    link: string
  ): Promise<boolean> {
    try {
      // 驗證 webhook
      const isValid = await this.validateWebhook(webhookUrl);
      if (!isValid) {
        logger.error('Discord webhook 無效，跳過發送');
        return false;
      }

      const messageTemplate = DISCORD_MESSAGE_TEMPLATES.NOTIFICATION[type];
      if (!messageTemplate) {
        throw new Error(`找不到對應的消息模板: ${type}`);
      }

      const message = messageTemplate(title, content, link);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      return response.ok;
    } catch (error) {
      logger.error('發送 Discord webhook 訊息失敗:', error);
      return false;
    }
  }
}

export const discordService = DiscordService.getInstance(); 