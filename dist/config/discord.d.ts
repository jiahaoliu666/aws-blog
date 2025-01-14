export declare const DISCORD_CONFIG: {
    CLIENT_ID: string;
    CLIENT_SECRET: string;
    BOT_TOKEN: string;
    readonly AUTHORIZE_URL: string;
    readonly REDIRECT_URI: string;
    API_ENDPOINT: string;
    GUILD_ID: string;
    RATE_LIMIT: {
        MAX_RETRIES: number;
        RETRY_DELAY: number;
    };
    TOKEN_ENDPOINT: string;
    isConfigValid: () => boolean;
};
export declare const DISCORD_MESSAGE_TEMPLATES: {
    NOTIFICATION: {
        ANNOUNCEMENT: (title: string, content: string, link: string) => {
            embeds: {
                title: string;
                description: string;
                color: number;
            }[];
        };
        NEWS: (title: string, content: string, link: string) => {
            embeds: {
                title: string;
                description: string;
                color: number;
            }[];
        };
        SOLUTIONS: (title: string, content: string, link: string) => {
            embeds: {
                title: string;
                description: string;
                color: number;
            }[];
        };
        ARCHITECTURE: (title: string, content: string, link: string) => {
            embeds: {
                title: string;
                description: string;
                color: number;
            }[];
        };
        KNOWLEDGE: (title: string, content: string, link: string) => {
            embeds: {
                title: string;
                description: string;
                color: number;
            }[];
        };
        TEST: (title: string, content: string, link: string) => {
            embeds: {
                title: string;
                description: string;
                color: number;
            }[];
        };
    };
};
export declare const DISCORD_BOT_CONFIG: {
    PERMISSIONS: string[];
    INTENTS: string[];
};
export declare const DISCORD_ERRORS: {
    readonly AUTH_FAILED: "DISCORD_AUTH_FAILED";
    readonly INVALID_TOKEN: "INVALID_DISCORD_TOKEN";
    readonly USER_NOT_FOUND: "DISCORD_USER_NOT_FOUND";
    readonly INVALID_REQUEST: "DISCORD_INVALID_REQUEST";
    readonly DM_FAILED: "DISCORD_DM_FAILED";
};
export declare const DISCORD_SCOPES: readonly ["identify", "bot", "applications.commands"];
