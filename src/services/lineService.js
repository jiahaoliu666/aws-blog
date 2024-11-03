const { lineConfig } = require("../config/line");
const { generateArticleTemplate } = require("../templates/lineTemplates");
const { logger } = require("../utils/logger");

async function sendArticleNotification(articleData) {
  try {
    // 獲取已開啟 LINE 通知的用戶
    const notificationUsers = await getLineNotificationUsers();

    // 提取用戶的 LINE ID
    const lineUserIds = notificationUsers
      .filter((user) => user.lineUserId && user.lineUserId.S)
      .map((user) => user.lineUserId.S);

    // 如果沒有用戶開啟通知，直接返回
    if (lineUserIds.length === 0) {
      logger.info("沒有用戶開啟 LINE 通知");
      return;
    }

    // 使用 multicast 發送訊息
    const response = await fetch(
      "https://api.line.me/v2/bot/message/multicast",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lineConfig.channelAccessToken}`,
        },
        body: JSON.stringify({
          to: lineUserIds,
          messages: [
            {
              type: "flex",
              altText: `新文章通知：${articleData.title}`,
              contents: {
                // 您現有的 Flex Message 內容
                // ...
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      if (error.details?.[0]?.message?.includes("recipient_not_found")) {
        logger.error("用戶未追蹤 LINE 官方帳號");
      }
    }

    logger.info(`成功發送 LINE 通知給 ${lineUserIds.length} 位用戶`);
  } catch (error) {
    logger.error("發送 LINE 通知失敗:", error);
    throw error;
  }
}

const lineService = {
  handleFollow: async (userId) => {
    // implementation
  },
  handleUnfollow: async (userId) => {
    // implementation
  },
};

module.exports = {
  sendArticleNotification,
  lineService,
};
