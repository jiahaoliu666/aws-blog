import { DISCORD_CONFIG, DISCORD_MESSAGE_TEMPLATES } from '@/config/discord';
import { logger } from '@/utils/logger';

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
}

export class DiscordService {
  private static instance: DiscordService;
  private retryCount: number = 0;

  private constructor() {}

  public static getInstance(): DiscordService {
    if (!DiscordService.instance) {
      DiscordService.instance = new DiscordService();
    }
    return DiscordService.instance;
  }

  // 驗證 Discord ID
  public async verifyDiscordId(discordId: string): Promise<boolean> {
    try {
      const response = await fetch(`${DISCORD_CONFIG.API_ENDPOINT}/users/${discordId}`, {
        headers: {
          Authorization: `Bot ${DISCORD_CONFIG.BOT_TOKEN}`
        }
      });

      if (!response.ok) {
        throw new Error('Discord ID 驗證失敗');
      }

      const user: DiscordUser = await response.json();
      return Boolean(user.id);
    } catch (error) {
      logger.error('Discord ID 驗證失敗:', error);
      return false;
    }
  }

  // 發送 Discord 通知
  public async sendNotification(
    webhookUrl: string,
    type: 'ANNOUNCEMENT' | 'NEWS' | 'SYSTEM',
    title: string,
    content: string
  ): Promise<boolean> {
    try {
      const messageTemplate = DISCORD_MESSAGE_TEMPLATES.NOTIFICATION[type];
      const message = messageTemplate(title, content);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error('發送 Discord 通知失敗');
      }

      return true;
    } catch (error) {
      logger.error('發送 Discord 通知失敗:', error);
      
      // 重試機制
      if (this.retryCount < DISCORD_CONFIG.RATE_LIMIT.MAX_RETRIES) {
        this.retryCount++;
        await new Promise(resolve => 
          setTimeout(resolve, DISCORD_CONFIG.RATE_LIMIT.RETRY_DELAY)
        );
        return this.sendNotification(webhookUrl, type, title, content);
      }
      
      this.retryCount = 0;
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
}

export const discordService = DiscordService.getInstance(); 