import { LineFollowStatus, ArticleData, LineMessage, LineApiResponse } from "../types/lineTypes";
export declare const checkLineFollowStatus: (userId: string) => Promise<boolean>;
interface VerificationCommandParams {
    lineUserId: string;
    userId: string;
}
interface LineServiceInterface {
    sendMessage(lineId: string, message: string | LineMessage): Promise<boolean>;
    sendWelcomeMessage(lineId: string): Promise<boolean>;
    broadcastMessage(message: LineMessage | LineMessage[]): Promise<LineApiResponse>;
    sendMulticast(message: string | LineMessage): Promise<LineApiResponse>;
    sendMulticastWithTemplate(articleData: ArticleData): Promise<LineApiResponse>;
    updateFollowerStatus(lineId: string, isFollowing: boolean): Promise<void>;
    requestVerification(lineId: string, userId: string): Promise<{
        success: boolean;
        verificationCode: string;
    }>;
    verifyCode(userId: string, code: string): Promise<{
        success: boolean;
        message?: string;
        data?: {
            isVerified: boolean;
            verificationStatus: string;
        };
    }>;
    getFollowers(): Promise<string[]>;
    checkFollowStatus(lineUserId: string): Promise<LineFollowStatus>;
    updateUserLineSettings(params: {
        userId: string;
        lineId: string;
        isVerified: boolean;
    }): Promise<void>;
    getUserLineSettings(userId: string): Promise<{
        lineId: string;
        isVerified: boolean;
    } | null>;
    broadcastNewsNotification(articleData: ArticleData): Promise<boolean>;
    sendNewsNotification(articleData: ArticleData): Promise<LineApiResponse>;
    generateVerificationCode(userId: string, lineId: string): Promise<string>;
    updateNotificationSettings(userId: string, settings: {
        lineNotification: boolean;
        emailNotification: boolean;
    }): Promise<void>;
    replyMessage(replyToken: string, messages: any[]): Promise<any>;
    handleVerificationCommand(params: VerificationCommandParams): Promise<{
        lineId: string;
        verificationCode: string;
    }>;
    resetVerification(userId: string): Promise<void>;
}
interface AnnouncementData {
    title: string;
    link: string;
    timestamp: string;
    summary: string;
}
interface SolutionData {
    title: string;
    link: string;
    timestamp: string;
    summary: string;
}
interface KnowledgeData {
    title: string;
    link: string;
    timestamp: string;
    summary: string;
}
export declare class LineService implements LineServiceInterface {
    private readonly channelAccessToken;
    private readonly apiUrl;
    private readonly client;
    constructor();
    replyMessage(replyToken: string, messages: any[]): Promise<void>;
    sendWelcomeMessage(lineId: string): Promise<boolean>;
    private pushMessage;
    checkFollowStatus(lineUserId: string): Promise<LineFollowStatus>;
    sendMessage(lineId: string, message: string | LineMessage): Promise<boolean>;
    broadcastMessage(message: LineMessage | LineMessage[]): Promise<LineApiResponse>;
    sendMulticast(message: string | LineMessage): Promise<LineApiResponse>;
    sendMulticastWithTemplate(articleData: ArticleData): Promise<LineApiResponse>;
    updateFollowerStatus(lineId: string, isFollowing: boolean): Promise<void>;
    requestVerification(lineId: string, userId: string): Promise<{
        success: boolean;
        verificationCode: string;
    }>;
    verifyCode(userId: string, code: string): Promise<{
        success: boolean;
        message?: string;
        data?: {
            isVerified: boolean;
            verificationStatus: string;
        };
    }>;
    getFollowers(): Promise<string[]>;
    updateUserLineSettings(params: {
        userId: string;
        lineId: string;
        isVerified: boolean;
    }): Promise<void>;
    getUserLineSettings(userId: string): Promise<{
        lineId: string;
        isVerified: boolean;
    } | null>;
    broadcastNewsNotification(articleData: ArticleData): Promise<boolean>;
    sendNewsNotification(articleData: ArticleData): Promise<LineApiResponse>;
    generateVerificationCode(userId: string, lineId: string): Promise<string>;
    updateNotificationSettings(userId: string, settings: {
        lineNotification: boolean;
        emailNotification: boolean;
    }): Promise<void>;
    handleVerificationCommand(params: VerificationCommandParams): Promise<{
        lineId: string;
        verificationCode: string;
    }>;
    resetVerification(userId: string): Promise<void>;
    sendAnnouncementNotification(announcementData: AnnouncementData): Promise<void>;
    sendSolutionNotification(solutionData: SolutionData): Promise<void>;
    sendKnowledgeNotification(knowledgeData: KnowledgeData): Promise<void>;
}
export declare const lineService: LineService;
export {};
