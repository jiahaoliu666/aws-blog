import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { sesClient } from "../config/aws";
import { EMAIL_CONFIG } from "../config/constants";
import { logger } from "../utils/logger";
import RateLimiter from "../utils/rateLimiter";
import { EmailNotification } from "../types/emailTypes";

const rateLimiter = new RateLimiter(EMAIL_CONFIG.RATE_LIMIT);

export class EmailService {
  async sendEmail(notification: EmailNotification) {
    try {
      await rateLimiter.acquire();

      const emailContent = notification.content;
      const params = {
        Source: process.env.SES_SENDER_EMAIL || process.env.NEXT_PUBLIC_SES_SENDER_EMAIL || 'no-reply@awsblog365.com',
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
            }
          }
        }
      };

      await sesClient.send(new SendEmailCommand(params));
      logger.info('成功發送郵件至:', { recipient: notification.to });
      return { success: true, error: null };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '發送郵件失敗' 
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
            if (!result.success && result.error) {
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
export const sendEmail = sendEmailNotification;  // 添加別名導出
