import { logger } from '@/utils/logger';

const requiredEnvVars = [
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'DISCORD_BOT_TOKEN',
  'DISCORD_GUILD_ID',
  'DISCORD_AUTHORIZE_URL'
] as const;

// 改為只在伺服器端檢查環境變數
if (typeof window === 'undefined') {
  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      console.warn(`警告: 缺少 Discord 環境變數: ${varName}`);
    }
  });
}

export const DISCORD_CONFIG = {
  CLIENT_ID: process.env.DISCORD_CLIENT_ID || '',
  CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || '',
  BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || '',
  get AUTHORIZE_URL() {
    const baseUrl = 'https://discord.com/oauth2/authorize';
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      response_type: 'code',
      scope: DISCORD_SCOPES.join(' '),
      redirect_uri: this.REDIRECT_URI,
      permissions: '2048',
      bot: 'true'
    });
    return `${baseUrl}?${params.toString()}`;
  },
  get REDIRECT_URI() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/api/discord/callback`;
  },
  API_ENDPOINT: 'https://discord.com/api/v10',
  GUILD_ID: process.env.DISCORD_GUILD_ID || '',
  RATE_LIMIT: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
  },
  TOKEN_ENDPOINT: 'https://discord.com/api/oauth2/token',
  isConfigValid: () => {
    try {
      const requiredConfigs = [
        'CLIENT_ID',
        'CLIENT_SECRET',
        'BOT_TOKEN',
        'GUILD_ID'
      ] as const;

      const missingConfigs = requiredConfigs.filter(
        config => !DISCORD_CONFIG[config as keyof typeof DISCORD_CONFIG]
      );

      if (missingConfigs.length > 0) {
        logger.error('缺少必要的 Discord 配置:', missingConfigs);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('檢查 Discord 配置時發生錯誤:', error);
      return false;
    }
  }
};

export const DISCORD_MESSAGE_TEMPLATES = {
  NOTIFICATION: {
    ANNOUNCEMENT: (title: string, content: string, link: string) => ({
      embeds: [{
        title: `🔔 AWS 最新公告`,
        description: `**標題：**\n${title}\n\n**總結：**\n${content}\n\n[->閱讀全文](${link})`,
        color: 0x00b7ff,
      }]
    }),

    NEWS: (title: string, content: string, link: string) => ({
      embeds: [{
        title: `📰 AWS 技術新聞`,
        description: `**標題：**\n${title}\n\n**總結：**\n${content}\n\n[->閱讀全文](${link})`,
        color: 0xff9900,
      }]
    }),

    SOLUTIONS: (title: string, content: string, link: string) => ({
      embeds: [{
        title: `💡 AWS 解決方案`,
        description: `**標題：**\n${title}\n\n**總結：**\n${content}\n\n[->閱讀全文](${link})`,
        color: 0x7AA116,
      }]
    }),

    ARCHITECTURE: (title: string, content: string, link: string) => ({
      embeds: [{
        title: `🏗️ AWS 架構參考`,
        description: `**標題：**\n${title}\n\n**總結：**\n${content}\n\n[->閱讀全文](${link})`,
        color: 0x527fff,
      }]
    }),

    KNOWLEDGE: (title: string, content: string, link: string) => ({
      embeds: [{
        title: `📚 AWS 知識中心`,
        description: `**標題：**\n${title}\n\n**總結：**\n${content}\n\n[->閱讀全文](${link})`,
        color: 0x3b873b,
      }]
    }),

    TEST: (title: string, content: string, link: string) => ({
      embeds: [{
        title: `✨ Discord 通知功能已啟用`,
        description: `歡迎使用 AWS Blog 365，您的 Discord 通知功能已成功啟用！\n\n[->訪問 AWS Blog 365](${link})`,
        color: 0x5865F2,
      }]
    })
  }
};

export const DISCORD_BOT_CONFIG = {
  PERMISSIONS: [
    'ADMINISTRATOR'
  ],
  INTENTS: [
    'GUILDS',
    'GUILD_MESSAGES',
    'DIRECT_MESSAGES',
    'MESSAGE_CONTENT'
  ]
};

export const DISCORD_ERRORS = {
  AUTH_FAILED: 'DISCORD_AUTH_FAILED',
  INVALID_TOKEN: 'INVALID_DISCORD_TOKEN',
  USER_NOT_FOUND: 'DISCORD_USER_NOT_FOUND',
  INVALID_REQUEST: 'DISCORD_INVALID_REQUEST',
  DM_FAILED: 'DISCORD_DM_FAILED'
} as const;

export const DISCORD_SCOPES = [
  'identify',
  'bot',
  'applications.commands'
] as const; 