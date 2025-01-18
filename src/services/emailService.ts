import { EMAIL_CONFIG } from "../config/constants";
import { logger } from "../utils/logger";
import RateLimiter from "../utils/rateLimiter";
import { EmailNotification } from "../types/emailTypes";
import { emailConfig } from "../config/email";

const rateLimiter = new RateLimiter(EMAIL_CONFIG.RATE_LIMIT);

interface EmailResult {
  success: boolean;
  error?: string | null;
  messageId?: string;
}

export class EmailService {
  private transporter: any;

  constructor() {
    if (typeof window === 'undefined') {
      const nodemailer = require('nodemailer');
      this.transporter = nodemailer.createTransport({
        host: emailConfig.smtp.host,
        port: emailConfig.smtp.port,
        secure: emailConfig.smtp.secure,
        auth: {
          user: emailConfig.smtp.auth.user,
          pass: emailConfig.smtp.auth.pass
        }
      });
    }
  }

  async sendEmail(notification: EmailNotification): Promise<EmailResult> {
    try {
      if (typeof window !== 'undefined') {
        throw new Error('郵件發送只能在伺服器端執行');
      }

      await rateLimiter.acquire();

      const emailContent = notification.html;
      const mailOptions = {
        from: process.env.SES_SENDER_EMAIL || process.env.NEXT_PUBLIC_SES_SENDER_EMAIL || 'no-reply@awsblog365.com',
        to: notification.to,
        subject: notification.subject,
        html: emailContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('成功發送郵件至:', { recipient: notification.to });
      return { success: true, error: null, messageId: info.messageId };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '發送郵件失敗' 
      };
    }
  }

  async sendBatchEmails(notifications: EmailNotification[]) {
    if (typeof window !== 'undefined') {
      throw new Error('批量郵件發送只能在伺服器端執行');
    }

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
  if (typeof window !== 'undefined') {
    throw new Error('郵件發送只能在伺服器端執行');
  }
  const emailService = new EmailService();
  return await emailService.sendEmail(notification);
};

export const sendEmail = sendEmailNotification;
