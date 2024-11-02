const { sendEmailNotification } = require("../services/emailService");
const { logger } = require("./logger");
const { EMAIL_CONFIG } = require("../config/constants");

// 重試機制
const sendEmailWithRetry = async (emailData, maxRetries = 3) => {
  let retryCount = 0;
  let lastError;

  while (retryCount < maxRetries) {
    try {
      logger.info(`嘗試發送郵件至 ${emailData.to} (第 ${retryCount + 1} 次)`);
      const result = await sendEmailNotification(emailData);

      if (result && result.success) {
        logger.info(`成功發送郵件至 ${emailData.to}`);
        return result;
      }

      throw new Error(result?.error || "發送郵件失敗");
    } catch (error) {
      lastError = error;
      retryCount++;

      if (retryCount === maxRetries) {
        logger.error(
          `發送郵件失敗 (重試 ${retryCount}/${maxRetries} 次):`,
          error
        );
        throw lastError;
      }

      logger.warn(`發送郵件失敗，準備重試 (${retryCount}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
};

// 失敗隊列
const failedNotifications = [];

// 處理失敗隊列的函數
const processFailedNotifications = async () => {
  if (!failedNotifications.length) return;

  logger.info(`開始處理 ${failedNotifications.length} 個失敗的通知`);

  for (const notification of failedNotifications) {
    try {
      if (!notification.email || !notification.articleData) {
        logger.error("無效的通知數據:", notification);
        continue;
      }

      await sendEmailWithRetry({
        to: notification.email,
        subject: "新的 AWS 部落格文章通知",
        articleData: notification.articleData,
      });

      // 移除成功處理的通知
      const index = failedNotifications.indexOf(notification);
      if (index > -1) {
        failedNotifications.splice(index, 1);
      }
    } catch (error) {
      logger.error(`重試發送通知失敗 (userId: ${notification.userId}):`, error);
      notification.retryCount = (notification.retryCount || 0) + 1;
    }
  }
};

// 生成通知郵件內容
const generateNewsNotificationEmail = (articleData) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c5282;">AWS 部落格最新文章通知</h2>
      <div style="padding: 20px; background-color: #f7fafc; border-radius: 8px;">
        <h3 style="color: #4a5568;">${articleData.title}</h3>
        <p style="color: #718096;">發布時間：${articleData.timestamp}</p>
        <a href="${articleData.link}" 
           style="display: inline-block; padding: 10px 20px; 
                  background-color: #4299e1; color: white; 
                  text-decoration: none; border-radius: 5px; 
                  margin-top: 15px;">
          閱讀全文
        </a>
      </div>
      <p style="color: #718096; font-size: 12px; margin-top: 20px;">
        此為系統自動發送的郵件，請勿直接回覆。
      </p>
    </div>
  `;
};

module.exports = {
  sendEmailWithRetry,
  failedNotifications,
  processFailedNotifications,
  generateNewsNotificationEmail,
};
