import { SendEmailCommand } from "@aws-sdk/client-ses";
import { sesClient } from '../config/aws';
import { EmailNotification } from '../types/emailTypes';
import { generateNewsNotificationEmail } from '../templates/emailTemplates';
import { EMAIL_CONFIG } from '../config/constants';
import { logger } from '@/utils/logger';
import { RateLimiter } from '@/utils/rateLimiter';

const rateLimiter = new RateLimiter(EMAIL_CONFIG.RATE_LIMIT);

export class EmailService {
  async sendEmail(notification: EmailNotification): Promise<boolean> {
    await rateLimiter.acquire();
    
    try {
      const emailContent = generateNewsNotificationEmail(notification.articleData);
      
      const params = {
        Source: process.env.SES_SENDER_EMAIL,
        Destination: {
          ToAddresses: [notification.to],
        },
        Message: {
          Subject: {
            Data: notification.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: emailContent,
              Charset: 'UTF-8',
            },
          },
        },
      };

      await sesClient.send(new SendEmailCommand(params));
      logger.info(`郵件成功發送至 ${notification.to}`);
      return true;
    } catch (error) {
      logger.error('發送郵件失敗:', error);
      throw error;
    }
  }

  async sendBatchEmails(notifications: EmailNotification[]): Promise<void> {
    const batches = this.chunkArray(notifications, EMAIL_CONFIG.BATCH_SIZE);
    
    for (const batch of batches) {
      await Promise.all(
        batch.map(notification => this.sendEmail(notification))
      );
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, i * size + size)
    );
  }
}

export const sendEmailNotification = async (notification: EmailNotification): Promise<boolean> => {
  const emailService = new EmailService();
  return await emailService.sendEmail(notification);
}; 