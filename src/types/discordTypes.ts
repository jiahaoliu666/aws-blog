export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  email?: string;
}

export interface DiscordToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface DiscordWebhook {
  id: string;
  type: number;
  name: string;
  avatar: string | null;
  channel_id: string;
  guild_id: string;
  application_id: string | null;
  token: string;
  url: string;
} 