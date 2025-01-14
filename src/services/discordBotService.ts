import type { Client, TextChannel } from 'discord.js';
import { ChannelType } from 'discord.js';
import { DISCORD_CONFIG } from '@/config/discord';
import { logger } from '@/utils/logger';

export class DiscordBotService {
  private static instance: DiscordBotService;
  private client: Client | null = null;

  private constructor() {}

  public static getInstance(): DiscordBotService {
    if (!DiscordBotService.instance) {
      DiscordBotService.instance = new DiscordBotService();
    }
    return DiscordBotService.instance;
  }

  private async initClient() {
    if (typeof window === 'undefined' && !this.client) {
      const { Client, GatewayIntentBits } = await import('discord.js');
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.MessageContent
        ]
      });

      this.client.once('ready', () => {
        logger.info('Discord Bot 已啟動');
        logger.info(`已登入為 ${this.client?.user?.tag}`);
      });

      this.client.on('error', (error) => {
        logger.error('Discord Bot 錯誤:', error);
      });
    }
  }

  public async start(): Promise<void> {
    if (typeof window !== 'undefined') {
      return; // 在客戶端不執行
    }

    try {
      await this.initClient();
      if (this.client) {
        await this.client.login(DISCORD_CONFIG.BOT_TOKEN);
      }
    } catch (error) {
      logger.error('Discord Bot 登入失敗:', error);
      throw error;
    }
  }

  public async createWebhook(channelId: string, name: string): Promise<string> {
    if (typeof window !== 'undefined') {
      throw new Error('此功能僅在伺服器端可用');
    }

    try {
      await this.initClient();
      if (!this.client) {
        throw new Error('Discord client 未初始化');
      }

      const channel = await this.client.channels.fetch(channelId);
      if (channel?.type !== ChannelType.GuildText) {
        throw new Error('無效的頻道');
      }

      const webhook = await channel.createWebhook({
        name: name,
        avatar: 'https://your-avatar-url.com/avatar.png'
      });

      return webhook.url;
    } catch (error) {
      logger.error('創建 Webhook 失敗:', error);
      throw error;
    }
  }

  public async checkFriendshipStatus(userId: string): Promise<boolean> {
    if (!this.client) {
      await this.initClient();
    }

    try {
      // 嘗試獲取與用戶的 DM 頻道
      const user = await this.client?.users.fetch(userId);
      if (!user) {
        return false;
      }

      const dmChannel = await user.createDM();
      return !!dmChannel;
    } catch (error) {
      logger.error('檢查好友狀態失敗:', error);
      return false;
    }
  }

  public async addFriend(userId: string): Promise<boolean> {
    if (!this.client) {
      await this.initClient();
    }

    try {
      const user = await this.client?.users.fetch(userId);
      if (!user) {
        return false;
      }

      // 創建 DM 頻道
      await user.createDM();
      return true;
    } catch (error) {
      logger.error('添加好友失敗:', error);
      return false;
    }
  }
}

export const discordBotService = DiscordBotService.getInstance(); 