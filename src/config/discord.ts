export const DISCORD_CONFIG = {
  CLIENT_ID: process.env.DISCORD_CLIENT_ID || '',
  CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || '',
  BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || '',
  WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || '',
  REDIRECT_URI: process.env.DISCORD_REDIRECT_URI || 'http://localhost:3000/api/discord/callback',
  API_ENDPOINT: 'https://discord.com/api/v10',
  GUILD_ID: process.env.DISCORD_GUILD_ID || '',
  NOTIFICATION_CHANNEL_ID: process.env.DISCORD_NOTIFICATION_CHANNEL_ID || '',
  RATE_LIMIT: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
  }
};

export const DISCORD_MESSAGE_TEMPLATES = {
  NOTIFICATION: {
    ANNOUNCEMENT: (title: string, content: string) => ({
      embeds: [{
        title: `📢 新公告：${title}`,
        description: content,
        color: 0x00ff00,
        timestamp: new Date().toISOString()
      }]
    }),
    NEWS: (title: string, content: string) => ({
      embeds: [{
        title: `📰 新聞：${title}`,
        description: content,
        color: 0x0099ff,
        timestamp: new Date().toISOString()
      }]
    }),
    SYSTEM: (title: string, content: string) => ({
      embeds: [{
        title: `🔔 系統通知：${title}`,
        description: content,
        color: 0xff9900,
        timestamp: new Date().toISOString()
      }]
    })
  }
};

export const DISCORD_BOT_CONFIG = {
  PERMISSIONS: [
    'SEND_MESSAGES',
    'VIEW_CHANNELS',
    'MANAGE_WEBHOOKS',
    'READ_MESSAGE_HISTORY'
  ],
  INTENTS: [
    'GUILDS',
    'GUILD_MESSAGES',
    'DIRECT_MESSAGES'
  ]
};

export const DISCORD_ERRORS = {
  AUTH_FAILED: 'DISCORD_AUTH_FAILED',
  INVALID_TOKEN: 'INVALID_DISCORD_TOKEN',
  WEBHOOK_FAILED: 'DISCORD_WEBHOOK_FAILED',
  USER_NOT_FOUND: 'DISCORD_USER_NOT_FOUND'
} as const;

export const DISCORD_SCOPES = [
  'identify',
  'email',
  'guilds.join',
  'webhook.incoming'
] as const; 