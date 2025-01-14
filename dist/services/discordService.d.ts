import { DiscordNotificationType } from '../types/discordTypes';
interface DiscordUser {
    id: string;
    username: string;
    discriminator: string;
}
export declare class DiscordService {
    private static instance;
    private retryCount;
    private dbClient;
    private constructor();
    static getInstance(): DiscordService;
    verifyDiscordId(discordId: string): Promise<boolean>;
    sendNotification(discordId: string, type: DiscordNotificationType, title: string, content: string, link: string): Promise<boolean>;
    private sendNotificationWithRetry;
    getUserInfo(discordId: string): Promise<DiscordUser | null>;
    exchangeCodeForToken(code: string): Promise<any>;
    sendNotificationToUser(userId: string, type: DiscordNotificationType, title: string, content: string, link: string): Promise<boolean>;
    sendDirectMessage(discordId: string, type: DiscordNotificationType, title: string, content: string, link: string): Promise<boolean>;
    getActiveDiscordUsers(): Promise<{
        discordId: string;
        userId: string;
    }[]>;
}
export declare const discordService: DiscordService;
export {};
