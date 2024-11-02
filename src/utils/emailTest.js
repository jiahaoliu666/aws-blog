const { sendEmailNotification } = require("../services/emailService");
const logger = require("./logger");

async function testEmailSending() {
  try {
    const testEmail = {
      to: "awsblogfeedback@gmail.com", // 替換為您的測試郵箱
      subject: "AWS Blog 通知系統測試",
      articleData: {
        title: "測試文章標題",
        link: "https://aws.amazon.com",
        timestamp: new Date().toLocaleString(),
      },
    };

    logger.info("開始發送測試郵件...");
    logger.info(`使用發件人地址: ${process.env.NEXT_PUBLIC_SES_SENDER_EMAIL}`);

    const result = await sendEmailNotification(testEmail);

    logger.info("測試郵件發送結果:", result);
    return result;
  } catch (error) {
    logger.error("測試郵件發送失敗:", error);
    throw error;
  }
}

testEmailSending().catch(console.error);
