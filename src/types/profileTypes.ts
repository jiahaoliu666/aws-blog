import { VerificationStep } from './lineTypes';

export interface FormData {
  avatar?: string;
  username: string;
  email: string;
  registrationDate?: string;
  password?: string;
  confirmPassword?: string;
  notifications: {
    email: boolean;
    line: boolean;
    browser: boolean;
    mobile: boolean;
  };
}

export type ActivityLog = {
  date: string;
  action: string;
}

export type ActivityLogExtended = {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  details?: string;
  status?: string;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  autoplay: boolean;
  notifications: boolean;
  privacy: 'private' | 'public' | 'friends';
}

export interface NotificationSettings {
  email: boolean;
  line: boolean;
}

export interface Feedback {
  rating: number;
  category: string;
  message: string;
}

export interface EditableFields {
  username: boolean;
  [key: string]: boolean;
}

export interface NotificationSectionProps {
  email?: boolean;
  line?: boolean;
  
  onSettingsChange?: (settings: NotificationSettings) => void;
  verificationState: {
    step: VerificationStep;
    status: string;
    message?: string;
    isVerified?: boolean;
  };
  user?: any;
  lineId: string;
  setLineId: (value: string) => void;
  verificationCode: string;
  setVerificationCode: (value: string) => void;
  verificationError?: string;
  verifyLineIdAndCode: () => void;
  isLoading: boolean;
  handleNotificationChange: (type: keyof NotificationSettings) => void;
  notificationSettings: {
    email: boolean;
    line: boolean;
  };
  handleVerification: () => Promise<void>;
  onCopyUserId: () => void;
  userId: string;
  formData?: FormData;
  isVerifying: boolean;
  verificationStep: VerificationStep;
  verificationProgress: number;
  handleStartVerification: () => void;
  handleConfirmVerification: () => void;
  settingsMessage?: string;
  settingsStatus?: 'success' | 'error';
  saveAllSettings: () => Promise<void>;
}

// 帳號資訊相關型別
export interface AccountInfo {
  createdAt: string;
  lastLogin: string;
  status: 'active' | 'suspended' | 'deactivated';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  loginHistory: LoginRecord[];
  securitySettings: SecuritySettings;
}

export interface LoginRecord {
  timestamp: string;
  ipAddress: string;
  device: string;
  location?: string;
  status: 'success' | 'failed';
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  loginNotifications: boolean;
  passwordLastChanged: string;
  securityQuestions: SecurityQuestion[];
}

export interface SecurityQuestion {
  id: string;
  question: string;
  isAnswered: boolean;
}

// 連結帳號相關型別
export interface LinkedAccount {
  id: string;
  provider: 'google' | 'line' | 'facebook';
  email?: string;
  username?: string;
  linkedAt: string;
  avatar?: string;
  status: 'active' | 'expired';
}

// 帳號管理區塊的 Props
export interface AccountManagementSectionProps {
  accountInfo: AccountInfo | null;
  linkedAccounts: LinkedAccount[];
  isLoading: boolean;
  onLinkAccount: (provider: string) => Promise<void>;
  onUnlinkAccount: (accountId: string) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  userEmail: string;
  createdAt?: string;
}

// Hook 回傳型別
export interface UseAccountManagementReturn {
  accountInfo: AccountInfo | null;
  linkedAccounts: LinkedAccount[];
  isLoading: boolean;
  handleLinkAccount: (provider: string) => Promise<void>;
  handleUnlinkAccount: (accountId: string) => Promise<void>;
  handleDeleteAccount: () => Promise<void>;
  handleUpdateSecurity: (settings: Partial<SecuritySettings>) => Promise<void>;
  handleAnswerSecurityQuestion: (questionId: string, answer: string) => Promise<void>;
  error: string | null;
}

// 帳號管理相關的 API 回應型別
export interface AccountManagementResponse {
  success: boolean;
  message: string;
  data?: {
    accountInfo?: AccountInfo;
    linkedAccounts?: LinkedAccount[];
  };
  error?: string;
}

// 帳號操作的請求型別
export interface AccountActionRequest {
  action: 'link' | 'unlink' | 'delete' | 'update';
  provider?: string;
  accountId?: string;
  settings?: Partial<SecuritySettings>;
}

// 新增 Toast 相關類型
export type ToastType = {
  type: 'success' | 'error' | 'warning' | 'info';
  message?: string;
};

export interface PreferenceSettings {
  categories: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  language: string;
  sortBy: 'date' | 'relevance' | 'popularity';
  autoSummarize: boolean;
  viewMode: 'grid' | 'list';
  theme: 'light' | 'dark';
}