export const EMAIL_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  BATCH_SIZE: 50,
  RATE_LIMIT: 14,
};

export const DB_TABLES = {
  LINE_VERIFICATIONS: 'AWS_Blog_LineVerifications',
  USER_ACTIVITY_LOG: 'AWS_Blog_UserActivityLog',
  USER_FAVORITES: 'AWS_Blog_UserFavorites',
  USER_NOTIFICATIONS: 'AWS_Blog_UserNotifications',
  USER_NOTIFICATION_SETTINGS: 'AWS_Blog_UserNotificationSettings',
  USER_PREFERENCES: 'AWS_Blog_UserPreferences',
  USER_PROFILES: 'AWS_Blog_UserProfiles',
  USER_RECENT_ARTICLES: 'AWS_Blog_UserRecentArticles',
};

export const NEWS_TABLE = 'AWS_Blog_News';

export const API_ENDPOINTS = {
  SEND_EMAIL: '/api/notifications/sendEmail',
  UPDATE_SETTINGS: '/api/notifications/settings',
  CHECK_STATUS: '/api/notifications/status',
  DELETE_ACCOUNT: '/api/profile/account/delete',
  UPDATE_STATUS: '/api/account/status',
  UPDATE_USER: '/api/users/update',
};

export const ERROR_CODES = {
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  RATE_LIMIT: 429,
  SERVER_ERROR: 500
} as const;

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY: 1000,
  MAX_DELAY: 5000
} as const; 