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
        Source: `"AWS Blog 通知" <${process.env.NEXT_PUBLIC_SES_SENDER_EMAIL}>`,
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

      const result = await sesClient.send(new SendEmailCommand(params));
      logger.info(`郵件成功發送至 ${notification.to}`);
      return {
        success: true,
        messageId: result.MessageId,
      };
    } catch (error) {
      logger.error(`發送郵件時發生錯誤: ${error.message}`);
      throw error;
    }
  }

  async sendBatchEmails(notifications) {
    const results = [];
    const batches = this.chunkArray(notifications, EMAIL_CONFIG.BATCH_SIZE);

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(async (notification) => {
          try {
            const result = await this.sendEmail(notification);
            if (!result.success) {
              throw new Error(result.error || "發送郵件失敗");
            }
            return { success: true, result };
          } catch (error) {
            logger.error(`批量發送郵件時發生錯誤: ${error.message}`);
            return {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "發送郵件時發生未知錯誤",
            };
          }
        })
      );
      results.push(...batchResults);
    }

    return results;
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
