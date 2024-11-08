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

export type VerificationStep = 'idle' | 'verifying' | 'confirming' | 'complete';
export type VerificationStatus = 'idle' | 'validating' | 'pending' | 'error' | 'success';

export interface VerificationState {
  step: VerificationStep;
  status: VerificationStatus;
  message?: string;
  isVerified?: boolean;
  error?: string;
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
  userId: string;
  lineId: string;
  isVerified: boolean;
  isFollowing: boolean;
  displayName: string;
  notificationPreferences: {
    news: boolean;
    announcements: boolean;
  };
  createdAt: string;
  updatedAt: string;
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

// DynamoDB 資料表結構
interface AWS_Blog_UserNotificationSettings {
  lineId: string;          // 主鍵
  userId?: string;         // 用戶 ID (驗證成功後填入)
  verificationCode: string; // 驗證碼
  verificationExpiry: number; // 驗證碼過期時間戳
  isVerified: boolean;     // 是否已驗證
  createdAt: string;       // 創建時間
  updatedAt: string;       // 更新時間
}

export interface LineVerificationProps {
  verificationState: VerificationState;
  lineId: string;
  setLineId: Dispatch<SetStateAction<string>>;
  verificationCode: string;
  setVerificationCode: Dispatch<SetStateAction<string>>;
  verifyLineIdAndCode: () => Promise<void>;
  userId: string;
  onCopyUserId: () => void;
}