export declare const EMAIL_CONFIG: {
    readonly MAX_RETRIES: 3;
    readonly RETRY_DELAY: 2000;
    readonly BATCH_SIZE: 50;
    readonly RATE_LIMIT: 14;
    readonly DEFAULT_SENDER: string;
};
export declare const DB_TABLES: {
    LINE_VERIFICATIONS: string;
    USER_ACTIVITY_LOG: string;
    USER_FAVORITES: string;
    USER_NOTIFICATIONS: string;
    USER_NOTIFICATION_SETTINGS: string;
    USER_PREFERENCES: string;
    USER_PROFILES: string;
    USER_RECENT_ARTICLES: string;
};
export declare const NEWS_TABLE = "AWS_Blog_News";
export declare const API_ENDPOINTS: {
    SEND_EMAIL: string;
    UPDATE_SETTINGS: string;
    CHECK_STATUS: string;
    DELETE_ACCOUNT: string;
    UPDATE_STATUS: string;
    UPDATE_USER: string;
};
export declare const ERROR_CODES: {
    readonly UNAUTHORIZED: 401;
    readonly NOT_FOUND: 404;
    readonly RATE_LIMIT: 429;
    readonly SERVER_ERROR: 500;
};
export declare const RETRY_CONFIG: {
    readonly MAX_RETRIES: 3;
    readonly BASE_DELAY: 1000;
    readonly MAX_DELAY: 5000;
};
