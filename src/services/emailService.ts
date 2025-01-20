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
    // 確保只在伺服器端初始化
    if (typeof window === 'undefined') {
      this.initializeTransporter();
    }
  }

  private async initializeTransporter() {
    try {
      // 動態導入 nodemailer
      const nodemailer = (await import('nodemailer')).default;
      
      this.transporter = nodemailer.createTransport({
        host: "email-smtp.ap-northeast-1.amazonaws.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD
        }
      });
    } catch (error) {
      logger.error('初始化郵件傳輸器失敗:', error);
    }
  }

  async sendEmail(notification: EmailNotification): Promise<EmailResult> {
    try {
      if (typeof window !== 'undefined') {
        throw new Error('郵件發送只能在伺服器端執行');
      }

      // 確保 transporter 已初始化
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      await rateLimiter.acquire();

      const emailContent = notification.html;
      const mailOptions = {
        from: process.env.SMTP_SENDER_EMAIL || process.env.SES_SENDER_EMAIL || process.env.NEXT_PUBLIC_SES_SENDER_EMAIL || 'no-reply@awsblog365.com',
        to: notification.to,
        subject: notification.subject,
        html: emailContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('成功發送郵件至:', { recipient: notification.to });
      return { success: true, error: null, messageId: info.messageId };
      
    } catch (error) {
      logger.error('發送郵件失敗:', error);
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
