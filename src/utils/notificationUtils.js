const { sendEmailNotification } = require("../services/emailService");
const { logger } = require("./logger");

// EmailData 介面不需要在 JavaScript 中定義

// 重試機制
const sendEmailWithRetry = async (emailData, maxRetries = 3) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      await sendEmailNotification(emailData);
      console.log(`郵件成功發送至 ${emailData.to}`);
      return true;
    } catch (error) {
      lastError = error;
      logger.error(`第 ${i + 1} 次重試失敗:`, error);
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)));
      }
    }
  }

  logger.error(`郵件發送失敗，已達到最大重試次數: ${maxRetries}`, lastError);
  throw lastError;
};

// 失敗隊列介面不需要在 JavaScript 中定義

// 失敗隊列
const failedNotifications = [];

// 處理失敗隊列的函數
const processFailedNotifications = async () => {
  const maxRetries = 3;

  for (const notification of [...failedNotifications]) {
    if (notification.retryCount >= maxRetries) {
      // 超過重試次數，從隊列中移除
      const index = failedNotifications.indexOf(notification);
      if (index > -1) {
        failedNotifications.splice(index, 1);
      }
      continue;
    }

    try {
      const emailData = {
        to: notification.email,
        subject: `新的 AWS 部落格文章：${notification.articleData.title}`,
        content: generateNewsNotificationEmail(notification.articleData),
        articleData: notification.articleData,
      };

      await sendEmailWithRetry(emailData);

      const index = failedNotifications.indexOf(notification);
      if (index > -1) {
        failedNotifications.splice(index, 1);
      }
    } catch (error) {
      notification.retryCount += 1;
      console.error(
        `重試發送通知失敗 (第${notification.retryCount}次):`,
        error
      );
    }
  }
};

// 生成通知郵件內容
const generateNewsNotificationEmail = (articleData) => {
  return `
新的 AWS 部落格文章已發布！

標題：${articleData.title}
發布時間：${articleData.timestamp}
閱讀文章：${articleData.link}

此為自動發送的通知郵件，請勿直接回覆。
`;
};

module.exports = {
  sendEmailWithRetry,
  failedNotifications,
  processFailedNotifications,
  generateNewsNotificationEmail,
};
