const { lineConfig } = require("../config/line");
const { generateArticleTemplate } = require("../templates/lineTemplates");
const { logger } = require("../utils/logger");

async function sendArticleNotification(articleData) {
  try {
    const response = await fetch(
      "https://api.line.me/v2/bot/message/multicast",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lineConfig.channelAccessToken}`,
        },
        body: JSON.stringify({
          to: articleData.lineUserIds,
          messages: [
            generateArticleTemplate({
              ...articleData,
              timestamp: Number(articleData.timestamp),
            }),
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Line API responded with status: ${response.status}`);
    }

    logger.info("Line 通知發送成功");
    return true;
  } catch (error) {
    logger.error("發送 Line 通知時發生錯誤:", error);
    return false;
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
