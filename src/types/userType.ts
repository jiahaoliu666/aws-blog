// src/types/userType.ts
import { ExtendedNews } from './newsType'; // 確保引入 ExtendedNews 類型

// 建議新增一個用戶角色的列舉型別
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  EDITOR = 'editor'
}

// 用戶基本資料介面
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
  role?: UserRole; // 新增：用戶角色
  isActive?: boolean; // 新增：帳戶是否啟用
  lineId?: string;  // 添加這個可選屬性
}

// LINE 設定介面
export interface LineSettings {
  id: string;
  isVerified: boolean;
  status?: 'idle' | 'validating' | 'success' | 'error';
}

// 通知設定介面
export interface NotificationSettings {
  email: boolean;
  line: boolean;
  pushNotification?: boolean; // 新增：推播通知
  frequency?: 'realtime' | 'daily' | 'weekly'; // 新增：通知頻率
}

// 表單資料介面
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

// 新增一個用戶偏好設定介面
export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark';
  emailFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
  timezone?: string;
}
