// src/types/userType.ts
import { ExtendedNews } from './newsType'; // 確保引入 ExtendedNews 類型

// 用戶基本資料介面
export interface User {
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
}

// LINE 設定介面
export interface LineSettings {
  id: string;
  isVerified: boolean;
}

// 通知設定介面
export interface NotificationSettings {
  email: boolean;
  line: boolean;
}

// 表單資料介面
export interface FormData {
  username: string;
  email: string;
  registrationDate: string;
  avatar: string;
  notifications: {
    line: boolean;
    email: boolean;
  };
  password: string;
  confirmPassword: string;
  feedbackTitle: string;
  feedbackContent: string;
  feedbackImage?: File;
  lineSettings: {
    id: string;
    isVerified: boolean;
  };
}

// 可編輯欄位介面
export interface EditableFields {
  username: boolean;
  password: boolean;
}

// 活動日誌介面
export interface ActivityLog {
  userId: string;
  action: string;
  timestamp: number;
  details?: string;
}

// 最近文章介面
export interface RecentArticle {
  translatedTitle: string;
  link: string;
  timestamp: string;
  sourcePage: string;
}

// 通知設定響應介面
export interface SaveSettingsResponse {
  success: boolean;
  message: string;
}

// 用戶設定狀態介面
export interface UserSettingsState {
  lineUserId: string;
  lineNotification: boolean;
  emailNotification: boolean;
  isSubscribed: boolean;
}

// 用戶通知狀態介面
export interface NotificationStatus {
  message: string | null;
  status: 'success' | 'error' | null;
}
