export interface FormData {
  avatar: string;
  username: string;
  email: string;
  registrationDate?: string;
  password?: string;
  confirmPassword?: string;
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

export type VerificationStep = 'idle' | 'verifying' | 'confirming' | 'complete';

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