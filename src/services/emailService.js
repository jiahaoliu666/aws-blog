const { SendEmailCommand } = require("@aws-sdk/client-ses");
const { sesClient } = require("../config/aws");
const {
  generateNewsNotificationEmail,
} = require("../templates/emailTemplates");
const { EMAIL_CONFIG } = require("../config/constants");
const { logger } = require("../utils/logger");
const RateLimiter = require("../utils/rateLimiter");

const rateLimiter = new RateLimiter(EMAIL_CONFIG.RATE_LIMIT);

class EmailService {
  async sendEmail(notification) {
    await rateLimiter.acquire();

    try {
      const emailContent = generateNewsNotificationEmail(
        notification.articleData
      );

      const params = {
        Source: process.env.SES_SENDER_EMAIL,
        Destination: {
          ToAddresses: [notification.to],
        },
        Message: {
          Subject: {
            Data: notification.subject,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: emailContent,
              Charset: "UTF-8",
            },
          },
        },
      };

      await sesClient.send(new SendEmailCommand(params));
      logger.info(`郵件成功發送至 ${notification.to}`);
      return true;
    } catch (error) {
      logger.error(`發送郵件時發生錯誤: ${error.message}`, error);
      throw error;
    }
  }

  async sendBatchEmails(notifications) {
    const batches = this.chunkArray(notifications, EMAIL_CONFIG.BATCH_SIZE);

    for (const batch of batches) {
      await Promise.all(
        batch.map((notification) => this.sendEmail(notification))
      );
    }
  }

  chunkArray(array, size) {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  }
}

const sendEmailNotification = async (notification) => {
  const emailService = new EmailService();
  return await emailService.sendEmail(notification);
};

module.exports = {
  EmailService,
  sendEmailNotification,
};
