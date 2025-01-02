import { DISCORD_CONFIG, DISCORD_MESSAGE_TEMPLATES } from '@/config/discord';
import { logger } from '@/utils/logger';
import { GetItemCommand, DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
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
    discordId: string,
    type: DiscordNotificationType,
    title: string,
    content: string,
    link: string
  ): Promise<boolean> {
    try {
      // 直接發送私人訊息
      return await this.sendDirectMessage(discordId, type, title, content, link);
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
        ProjectionExpression: "discordId"
      };

      const result = await this.dbClient.send(new GetItemCommand(params));
      const discordId = result.Item?.discordId?.S;

      if (!discordId) {
        logger.error(`用戶 ${userId} 沒有有效的 Discord ID`);
        return false;
      }

      return await this.sendNotification(discordId, type, title, content, link);
    } catch (error) {
      logger.error(`發送通知給用戶 ${userId} 失敗:`, error);
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

      logger.info(`嘗試發送私人訊息給用戶 ${discordId}`);

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
        const error = await createDMResponse.json();
        logger.error('建立 DM 頻道失敗:', error);
        throw new Error('無法建立私人訊息頻道');
      }

      const dmChannel = await createDMResponse.json();
      logger.info(`成功建立 DM 頻道 ${dmChannel.id}`);

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
        const error = await sendMessageResponse.json();
        logger.error('發送訊息失敗:', error);
        throw new Error('發送私人訊息失敗');
      }

      logger.info(`成功發送訊息給用戶 ${discordId}`);
      return true;
    } catch (error) {
      logger.error('發送 Discord 私人訊息失敗:', error);
      return false;
    }
  }

  async getActiveDiscordUsers() {
    const ddbClient = new DynamoDBClient({ region: 'ap-northeast-1' });
    const command = new ScanCommand({
      TableName: 'AWS_Blog_UserNotificationSettings',
      FilterExpression: 'discordNotification = :dn',
      ExpressionAttributeValues: {
        ':dn': { BOOL: true }
      }
    });

    const result = await ddbClient.send(command);
    return (result.Items || []).map(item => ({
      discordId: item.discordId.S || '',
      userId: item.userId.S || ''
    }));
  }
}

export const discordService = DiscordService.getInstance(); 