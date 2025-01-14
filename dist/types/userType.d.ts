import { ExtendedNews } from './newsType';
export declare enum UserRole {
    USER = "user",
    ADMIN = "admin",
    EDITOR = "editor"
}
export interface User {
    id: string;
    accessToken: string;
    refreshToken: string;
    username: string;
    userId: string;
    sub: string;
    email?: string;
    registrationDate?: string;
    favorites?: ExtendedNews[];
    lineSettings?: LineSettings;
    notifications?: NotificationSettings;
    avatar?: string;
    role?: UserRole;
    isActive?: boolean;
    lineId?: string;
}
export interface LineSettings {
    id: string;
    isVerified: boolean;
    status?: 'idle' | 'validating' | 'success' | 'error';
}
export interface NotificationSettings {
    email: boolean;
    line: boolean;
    pushNotification?: boolean;
    frequency?: 'realtime' | 'daily' | 'weekly';
}
export interface FormData {
    username: string;
    email: string;
    registrationDate: string;
    avatar: string;
    password: string;
    confirmPassword: string;
    feedbackTitle: string;
    feedbackContent: string;
    feedbackImage?: File;
    notifications: {
        email: boolean;
        line: boolean;
    };
    showEmailSettings?: boolean;
    showLineSettings?: boolean;
}
export interface EditableFields {
    username: boolean;
    password: boolean;
}
export interface ActivityLog {
    userId: string;
    action: string;
    timestamp: number;
    details?: string;
}
export interface RecentArticle {
    translatedTitle: string;
    link: string;
    timestamp: string;
    sourcePage: string;
}
export interface SaveSettingsResponse {
    success: boolean;
    message: string;
}
export interface UserSettingsState {
    lineUserId: string;
    lineNotification: boolean;
    emailNotification: boolean;
    isSubscribed: boolean;
}
export interface NotificationStatus {
    message: string | null;
    status: 'success' | 'error' | null;
}
export interface UserPreferences {
    language: string;
    theme: 'light' | 'dark';
    emailFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
    timezone?: string;
}
