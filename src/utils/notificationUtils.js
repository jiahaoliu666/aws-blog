const { sendEmailNotification } = require("../services/emailService");
const { logger } = require("./logger");
const { EMAIL_CONFIG } = require("../config/constants");

// 重試機制
const sendEmailWithRetry = async (notification, retryCount = 0) => {
  try {
    // 檢查必要的參數
    if (!notification || !notification.to || !notification.articleData) {
      throw new Error("無效的通知參數");
    }

    const result = await sendEmailNotification({
      to: notification.to,
      subject: `新的 AWS 部落格文章：${notification.articleData.title}`,
      content: generateNewsNotificationEmail(notification.articleData),
      articleData: notification.articleData,
    });

    // 確保結果包含 success 屬性
    if (!result || typeof result.success !== "boolean") {
      throw new Error("無效的郵件發送結果");
    }

    if (!result.success) {
      throw new Error(result.error || "發送郵件失敗");
    }

    logger.info(`成功發送郵件至 ${notification.to}`);
    return result;
  } catch (error) {
    logger.error(`發送通知失敗 (第${retryCount + 1}次嘗試): ${error.message}`);

    if (retryCount < EMAIL_CONFIG.MAX_RETRIES) {
      // 使用指數退避策略
      const delay = EMAIL_CONFIG.RETRY_DELAY * Math.pow(2, retryCount);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendEmailWithRetry(notification, retryCount + 1);
    }

    return {
      success: false,
      error: error.message || "發送郵件失敗",
      maxRetriesReached: true,
    };
  }
};

// 失敗隊列
const failedNotifications = [];

// 處理失敗隊列的函數
const processFailedNotifications = async () => {
  if (failedNotifications.length === 0) {
    return;
  }

  logger.info(`開始處理失敗隊列，共 ${failedNotifications.length} 條通知`);

  try {
    // 複製隊列以避免處理時的修改影響迭代
    const notifications = [...failedNotifications];

    for (const notification of notifications) {
      if (notification.retryCount >= EMAIL_CONFIG.MAX_RETRIES) {
        logger.warn(`通知已達到最大重試次數: ${notification.email}`);
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

        const result = await sendEmailWithRetry(emailData);

        if (result.success) {
          const index = failedNotifications.indexOf(notification);
          if (index > -1) {
            failedNotifications.splice(index, 1);
          }
          logger.info(`重試成功: ${notification.email}`);
        } else {
          notification.retryCount += 1;
          logger.error(
            `重試失敗 (第${notification.retryCount}次): ${notification.email}`
          );
        }
      } catch (error) {
        notification.retryCount += 1;
        logger.error(`處理失敗通知時發生錯誤: ${error.message}`);
      }
    }
  } catch (error) {
    logger.error(`處理失敗隊列時發生錯誤: ${error.message}`);
    throw error;
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
