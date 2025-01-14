import { EmailNotification } from "../types/emailTypes";
export declare class EmailService {
    sendEmail(notification: EmailNotification): Promise<{
        success: boolean;
        error: null;
    } | {
        success: boolean;
        error: string;
    }>;
    sendBatchEmails(notifications: EmailNotification[]): Promise<PromiseSettledResult<any>[]>;
    private chunkArray;
}
export declare const sendEmailNotification: (notification: EmailNotification) => Promise<{
    success: boolean;
    error: null;
} | {
    success: boolean;
    error: string;
}>;
export declare const sendEmail: (notification: EmailNotification) => Promise<{
    success: boolean;
    error: null;
} | {
    success: boolean;
    error: string;
}>;
