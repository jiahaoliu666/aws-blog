import { DISCORD_MESSAGE_TEMPLATES } from '@/config/discord';

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

export type DiscordNotificationType = keyof typeof DISCORD_MESSAGE_TEMPLATES.NOTIFICATION;

export interface DiscordSettings {
  discordId: string;
  discordNotification: boolean;
  updatedAt: string;
}

export interface NotificationUser {
  userId: { S: string };
  discordId?: { S: string };
  discordNotification?: { BOOL: boolean };
} 