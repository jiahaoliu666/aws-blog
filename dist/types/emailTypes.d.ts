export interface ArticleData {
    title: string;
    content: string;
}
export interface EmailNotification {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    articleData?: ArticleData;
}
export interface NotificationSettings {
    userId: string;
    email: string;
    emailNotification: boolean;
    lineNotification: boolean;
}
export interface NotificationUser {
    userId: {
        S: string;
    };
    email: {
        S: string;
    };
    emailNotification: {
        BOOL: boolean;
    };
}
