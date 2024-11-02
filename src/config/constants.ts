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
};

export const API_ENDPOINTS = {
  SEND_EMAIL: '/api/notifications/sendEmail',
  UPDATE_SETTINGS: '/api/notifications/settings',
  CHECK_STATUS: '/api/notifications/status',
}; 