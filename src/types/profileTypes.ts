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
  all: boolean;
  line: boolean;
  browser: boolean;
  mobile: boolean;
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
  browser?: boolean;
  mobile?: boolean;
  
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
    all?: boolean;
    line: boolean;
    browser: boolean;
    mobile: boolean;
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
} 