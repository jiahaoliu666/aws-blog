const EMAIL_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  BATCH_SIZE: 50,
  RATE_LIMIT: 14,
};

const DB_TABLES = {
  NEWS: "AWS_Blog_News",
  NOTIFICATION_SETTINGS: "AWS_Blog_UserNotificationSettings",
  USER_NOTIFICATIONS: "AWS_Blog_UserNotifications",
};

const API_ENDPOINTS = {
  SEND_EMAIL: "/api/notifications/sendEmail",
  UPDATE_SETTINGS: "/api/notifications/settings",
  CHECK_STATUS: "/api/notifications/status",
};

module.exports = {
  EMAIL_CONFIG,
  DB_TABLES,
  API_ENDPOINTS,
};
