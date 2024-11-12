import { UseProfileCoreReturn } from './useProfileCore';
import { UseProfileFormReturn } from './useProfileForm';
import { UseProfileAvatarReturn } from './useProfileAvatar';
import { UseProfilePasswordReturn } from './useProfilePassword';
import { UseProfileActivityReturn } from './useProfileActivity';
import { UseProfileArticlesReturn } from './useProfileArticles';
import { UseProfileNotificationsReturn } from './useNotificationSettings';
import { UseProfilePreferencesReturn } from './useProfilePreferences';

// 匯出所有 hooks
export { useProfileCore } from './useProfileCore';
export { useProfileForm } from './useProfileForm';
export { useProfileAvatar } from './useProfileAvatar';
export { useProfilePassword } from './useProfilePassword';
export { useProfileActivity } from './useProfileActivity';
export { useProfileArticles } from './useProfileArticles';
export { useProfileNotifications } from './useNotificationSettings';
export { useProfilePreferences } from './useProfilePreferences';

// 匯出型別定義
export type {
  UseProfileCoreReturn,
  UseProfileFormReturn,
  UseProfileAvatarReturn,
  UseProfilePasswordReturn,
  UseProfileActivityReturn,
  UseProfileArticlesReturn,
  UseProfileNotificationsReturn,
  UseProfilePreferencesReturn,
};

// 基本介面定義
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
  showEmailSettings: boolean;
  showLineSettings: boolean;
}

export interface EditableFields {
  username: boolean;
  password: boolean;
  [key: string]: boolean;
}

export interface NotificationSettings {
  emailNotification: boolean;
  browser?: boolean;
  mobile?: boolean;
  line?: boolean;
}

export interface Article {
  translatedTitle: string;
  link: string;
  timestamp: string;
  sourcePage: string;
}

export interface ActivityLog {
  date: string;
  action: string;
}

export interface PreferenceSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  reduceMotion: boolean;
  highContrast: boolean;
  accountStatus: 'active' | 'suspended' | 'deactivated';
  email: string;
  username: string;
  joinDate: string;
}

// 常數定義
export const PROFILE_CONSTANTS = {
  MAX_USERNAME_LENGTH: 30,
  MIN_PASSWORD_LENGTH: 8,
  MAX_FEEDBACK_LENGTH: 1000,
  AVATAR_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  VALID_IMAGE_TYPES: ['image/jpeg', 'image/png'],
  ACTIVITY_LOG_LIMIT: 12,
  RECENT_ARTICLES_LIMIT: 12
};

export const PREFERENCE_CONSTANTS = {
  SUPPORTED_LANGUAGES: ['zh-TW', 'en', 'ja'],
  SUPPORTED_THEMES: ['light', 'dark', 'system'],
  FONT_SIZES: ['small', 'medium', 'large'],
  DEFAULT_PREFERENCES: {
    theme: 'system',
    language: 'zh-TW',
    fontSize: 'medium',
    reduceMotion: false,
    highContrast: false,
  } as const
};

// 工具函數
export const profileUtils = {
  validateUsername: (username: string): boolean => {
    return username.length > 0 && username.length <= PROFILE_CONSTANTS.MAX_USERNAME_LENGTH;
  },

  validatePassword: (password: string): boolean => {
    return password.length >= PROFILE_CONSTANTS.MIN_PASSWORD_LENGTH &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password) &&
           /[^A-Za-z0-9]/.test(password);
  },

  calculatePasswordStrength: (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  },

  formatDate: (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return dateString;
    }
  },

  validateImageFile: (file: File): boolean => {
    return PROFILE_CONSTANTS.VALID_IMAGE_TYPES.includes(file.type) &&
           file.size <= PROFILE_CONSTANTS.AVATAR_MAX_SIZE;
  }
};

export const preferenceUtils = {
  isValidTheme: (theme: string): theme is 'light' | 'dark' | 'system' => {
    return PREFERENCE_CONSTANTS.SUPPORTED_THEMES.includes(theme);
  },

  isValidLanguage: (language: string): boolean => {
    return PREFERENCE_CONSTANTS.SUPPORTED_LANGUAGES.includes(language);
  },

  isValidFontSize: (fontSize: string): fontSize is 'small' | 'medium' | 'large' => {
    return PREFERENCE_CONSTANTS.FONT_SIZES.includes(fontSize);
  },

  getSystemTheme: (): 'light' | 'dark' => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
};

// 錯誤訊息
export const PROFILE_ERROR_MESSAGES = {
  INVALID_USERNAME: '使用者名稱長度必須在 1-30 字元之間',
  INVALID_PASSWORD: '密碼必須包含大小寫字母、數字和特殊符號，且長度至少為 8 位',
  PASSWORDS_NOT_MATCH: '兩次輸入的密碼不一致',
  INVALID_IMAGE: '請上傳 JPG 或 PNG 格式的圖片，大小不超過 5MB',
  UPLOAD_FAILED: '上傳失敗，請稍後再試',
  UPDATE_FAILED: '更新失敗，請稍後再試',
  FEEDBACK_TOO_LONG: '回饋內容不能超過 1000 字'
};

export const PREFERENCE_SUCCESS_MESSAGES = {
  SETTINGS_UPDATED: '偏好設定已更新',
  SETTINGS_RESET: '設定已重置為預設值'
};

// 狀態類型
export type ProfileTab = 'profile' | 'security' | 'notifications' | 'activity';
export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';
export type SettingsStatus = 'success' | 'error' | null;
export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSizeOption = 'small' | 'medium' | 'large';
export type PreferenceStatus = 'idle' | 'loading' | 'success' | 'error';

// 事件類型
export interface ProfileEvent {
  type: 'update' | 'password' | 'avatar' | 'feedback' | 'settings';
  timestamp: number;
  data?: any;
}

export interface PreferenceEvent {
  type: 'theme' | 'language' | 'fontSize' | 'accessibility' | 'delete';
  value: any;
  timestamp: number;
}