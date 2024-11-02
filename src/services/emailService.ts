import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { sesClient } from "../config/aws";
import { generateNewsNotificationEmail } from "../templates/emailTemplates";
import { EMAIL_CONFIG } from "../config/constants";
import { logger } from "../utils/logger";
import RateLimiter from "../utils/rateLimiter";
import { EmailNotification } from "../types/emailTypes";

const rateLimiter = new RateLimiter(EMAIL_CONFIG.RATE_LIMIT);

export class EmailService {
  async sendEmail(notification: EmailNotification) {
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

      const result = await sesClient.send(new SendEmailCommand(params));
      logger.info(`郵件成功發送至 ${notification.to}`);
      return {
        success: true,
        messageId: result.MessageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      logger.error(`發送郵件時發生錯誤: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async sendBatchEmails(notifications: EmailNotification[]) {
    const results: PromiseSettledResult<any>[] = [];
    const batches = this.chunkArray(notifications, EMAIL_CONFIG.BATCH_SIZE);

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(async (notification) => {
          try {
            const result = await this.sendEmail(notification);
            if (!result.success) {
              throw new Error(result.error);
            }
            return result;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知錯誤';
            logger.error(`批量發送郵件時發生錯誤: ${errorMessage}`);
            throw new Error(errorMessage);
          }
        })
      );
      results.push(...batchResults);
    }

    return results;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  }
}

export const sendEmailNotification = async (notification: EmailNotification) => {
  const emailService = new EmailService();
  return await emailService.sendEmail(notification);
}; 