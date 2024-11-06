import { User } from './userType';

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
  type: string;
  text?: string;
  altText?: string;
  contents?: any;
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
  message: string;
  displayName: string;
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
}