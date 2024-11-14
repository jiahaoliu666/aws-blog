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

export enum VerificationStep {
  INITIAL = 'INITIAL',
  IDLE = 'IDLE',
  STARTED = 'STARTED',
  VERIFYING = 'VERIFYING',
  COMPLETE = 'COMPLETE',
  COMPLETED = 'COMPLETED',
  ADD_FRIEND = 'ADD_FRIEND',
  INPUT_LINE_ID = 'INPUT_LINE_ID',
  VERIFY_CODE = 'VERIFY_CODE',
  SCAN_QR = 'SCAN_QR',
  SEND_ID = 'SEND_ID'
}

export enum VerificationStatus {
  IDLE = 'IDLE',
  PENDING = 'PENDING',
  VALIDATING = 'VALIDATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface VerificationState {
  step: VerificationStep;
  status: VerificationStatus;
  isVerified: boolean;
  message: string;
  progress: number;
  currentStep: number;
  retryCount: number;
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
  verificationCode?: string;
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
  userId: string;          // 主鍵 (使用 AuthContext 的 userId)
  lineId: string;          // LINE 用戶 ID
  verificationCode: string; // 驗證碼
  verificationExpiry: number; // 驗證碼過期時間戳
  verificationStep: string;   // 驗證步驟
  verificationStatus: string; // 驗證狀態
  isVerified: boolean;     // 是否已驗證
  notificationPreferences: {
    news: boolean;
    announcements: boolean;
  };
  createdAt: string;       // 創建時間
  updatedAt: string;       // 更新時間
}

export interface VerificationStepInfo {
  number: number;
  title: string;
  description: string;
  icon?: string;
}

export const VERIFICATION_STEPS: VerificationStepInfo[] = [
  {
    number: 1,
    title: '準備開始',
    description: '開始驗證流程'
  },
  {
    number: 2,
    title: '加入好友',
    description: '掃描 QR Code 加入 LINE 好友'
  },
  {
    number: 3,
    title: '輸入驗證',
    description: '輸入 LINE ID 與驗證碼'
  },
  {
    number: 4,
    title: '完成驗證',
    description: '驗證完成並啟用通知'
  }
];

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
  // ... other notification settings ...
}