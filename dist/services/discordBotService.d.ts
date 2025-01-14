export declare class DiscordBotService {
    private static instance;
    private client;
    private constructor();
    static getInstance(): DiscordBotService;
    private initClient;
    start(): Promise<void>;
    createWebhook(channelId: string, name: string): Promise<string>;
    checkFriendshipStatus(userId: string): Promise<boolean>;
    addFriend(userId: string): Promise<boolean>;
}
export declare const discordBotService: DiscordBotService;
