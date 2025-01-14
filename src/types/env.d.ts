declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DISCORD_CLIENT_ID: string;
      DISCORD_CLIENT_SECRET: string;
      DISCORD_BOT_TOKEN: string;
      DISCORD_WEBHOOK_URL: string;
      DISCORD_REDIRECT_URI: string;
      DISCORD_GUILD_ID: string;
      DISCORD_NOTIFICATION_CHANNEL_ID: string;
      USER_TABLE_NAME: string;
    }
  }
}

export {}; 