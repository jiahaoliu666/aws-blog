import { User } from './userType';
import { Dispatch, SetStateAction } from 'react';
export interface LineConfig {
    channelAccessToken: string;
    channelSecret: string;
    webhookUrl: string;
    basicId: string;
    qrCodeUrl: string;
    officialAccountName: string;
    apiUrl: string;
    validateConfig: () => void;
}
export interface ArticleData {
    title: string;
    link: string;
    timestamp: string;
    summary?: string;
}
export interface LineMessage {
    type: 'text' | 'template' | 'flex';
    text?: string;
    altText?: string;
    contents?: any;
    template?: {
        type: string;
        text?: string;
        actions?: Array<{
            type: string;
            label: string;
            uri?: string;
            data?: string;
        }>;
    };
}
export interface BroadcastMessagePayload {
    messages: LineMessage[];
}
export interface LineNotificationResponse {
    success: boolean;
    message?: string;
    error?: string;
}
export interface LineFollowStatus {
    isFollowing: boolean;
    followed: boolean;
    message: string;
    displayName: string;
    timestamp: string;
}
export interface ProfileLogicReturn {
    user: User | null;
    formData: {
        username: string;
        email: string;
        registrationDate: string;
        avatar: string;
        notifications: {
            email: boolean;
            line: boolean;
        };
        password: string;
        confirmPassword: string;
        feedbackTitle: string;
        feedbackContent: string;
        showEmailSettings: boolean;
        showLineSettings: boolean;
    };
    verificationState: VerificationState;
    verificationCode: string;
    setVerificationCode: Dispatch<SetStateAction<string>>;
    startVerification: () => Promise<void>;
    confirmVerificationCode: (code: string) => Promise<void>;
    lineId: string;
    setLineId: Dispatch<SetStateAction<string>>;
}
export declare enum VerificationStep {
    INITIAL = "INITIAL",
    IDLE = "IDLE",
    STARTED = "STARTED",
    VERIFYING = "VERIFYING",
    COMPLETE = "COMPLETE",
    COMPLETED = "COMPLETED",
    ADD_FRIEND = "ADD_FRIEND",
    VERIFY_CODE = "VERIFY_CODE",
    SCAN_QR = "SCAN_QR"
}
export declare enum VerificationStatus {
    IDLE = "IDLE",
    PENDING = "PENDING",
    VALIDATING = "VALIDATING",
    SUCCESS = "SUCCESS",
    ERROR = "ERROR"
}
export interface VerificationState {
    step: VerificationStep;
    status: VerificationStatus;
    isVerified: boolean;
    message: string;
    progress: number;
    currentStep: number;
    retryCount: number;
    lastVerified?: string;
    verificationCount?: number;
    lastCancelled?: string;
    cancellationCount?: number;
}
export interface VerificationRequest {
    userId: string;
    lineId: string;
    verificationCode: string;
    expiry: number;
}
export interface VerificationResponse {
    success: boolean;
    verificationCode?: string;
    message?: string;
    error?: string;
}
export interface LineWebhookEvent {
    type: 'message' | 'follow' | 'unfollow' | 'join' | 'leave' | 'postback';
    replyToken?: string;
    source: {
        userId: string;
        type: 'user' | 'group' | 'room';
        groupId?: string;
        roomId?: string;
    };
    timestamp: number;
    message?: {
        type: string;
        id: string;
        text?: string;
    };
    postback?: {
        data: string;
    };
}
export interface LineApiResponse {
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
}
export interface LineUserSettings {
    lineId: string;
    isVerified: boolean;
    displayName: string;
}
export interface LineVerificationRecord {
    lineId: string;
    userId?: string;
    verificationCode: string;
    verificationExpiry: number;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface VerificationStepInfo {
    number: number;
    title: string;
    description: string;
    icon?: string;
}
export declare const VERIFICATION_STEPS: VerificationStepInfo[];
export interface LineVerificationProps {
    verificationState: VerificationState;
    lineId: string;
    setLineId: (lineId: string) => void;
    verificationCode: string;
    setVerificationCode: (value: string) => void;
    verifyLineIdAndCode: () => void;
    onCopyUserId: () => void;
    userId: string;
}
export interface LineNotificationState {
    enabled: boolean;
    isVerified: boolean;
    verificationStatus: VerificationStatus;
}
export interface NotificationSettingsState {
    lineNotification: LineNotificationState;
}
export interface LineVerificationHistory {
    lastVerified: string | null;
    lastCancelled: string | null;
    verificationCount: number;
    cancellationCount: number;
}
export declare const VERIFICATION_PROGRESS: {
    readonly INITIAL: 0;
    readonly SCAN_QR: 33;
    readonly ADD_FRIEND: 66;
    readonly VERIFY_CODE: 100;
};
export type VerificationProgress = typeof VERIFICATION_PROGRESS[keyof typeof VERIFICATION_PROGRESS];
