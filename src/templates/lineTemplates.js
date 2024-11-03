const createNewsNotificationTemplate = (articleData) => ({
  type: "text",
  text: `🔔 新文章通知！

📝 ${articleData.title}

🔗 閱讀全文：${articleData.link}

⏰ 發布時間：${new Date(articleData.timestamp).toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
  })}

${articleData.summary ? `\n📋 摘要：\n${articleData.summary}` : ""}`,
});

const createWelcomeTemplate = (userName) => ({
  type: "flex",
  altText: `歡迎 ${userName}`,
  contents: {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `歡迎 ${userName}！`,
          weight: "bold",
          size: "xl",
          color: "#2c5282",
        },
        {
          type: "text",
          text: "感謝您訂閱 AWS 部落格通知",
          margin: "md",
          size: "md",
          color: "#4a5568",
        },
        {
          type: "text",
          text: "我們會在有新文章時立即通知您",
          margin: "sm",
          size: "sm",
          color: "#718096",
        },
      ],
      paddingAll: "20px",
    },
  },
});

const generateArticleTemplate = createNewsNotificationTemplate;

module.exports = {
  createNewsNotificationTemplate,
  createWelcomeTemplate,
  generateArticleTemplate,
};
