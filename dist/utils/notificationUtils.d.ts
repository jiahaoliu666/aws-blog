import { EmailNotification } from '../types/emailTypes';
interface FailedNotification {
    userId: string;
    articleId: string;
    type: string;
    error: string;
    email?: string;
    retryCount?: number;
    lastRetryTime?: number;
}
export declare const failedNotifications: FailedNotification[];
export declare function processFailedNotifications(): Promise<void>;
export declare function sendEmailWithRetry(emailData: EmailNotification, maxRetries?: number): Promise<void>;
export {};
