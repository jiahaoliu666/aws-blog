export const EMAIL_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  BATCH_SIZE: 50,
  RATE_LIMIT: 14,
};

export const DB_TABLES = {
  NEWS: 'AWS_Blog_News',
  NOTIFICATION_SETTINGS: 'AWS_Blog_UserNotificationSettings',
  USER_NOTIFICATIONS: 'AWS_Blog_UserNotifications',
  USERS: 'AWS_Blog_Users',
  USER_ACTIVITIES: 'AWS_Blog_UserActivities',
  USER_PREFERENCES: 'AWS_Blog_UserPreferences',
  USER_FAVORITES: 'AWS_Blog_UserFavorites',
};

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
  RATE_LIMIT: 429,
  SERVER_ERROR: 500
} as const;

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY: 1000,
  MAX_DELAY: 5000
} as const; 