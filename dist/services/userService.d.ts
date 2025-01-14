interface DiscordSettings {
    discordId: string;
    discordUsername: string;
    discordDiscriminator: string;
}
export declare const updateUserDiscordSettings: (userId: string, settings: DiscordSettings) => Promise<boolean>;
export {};
