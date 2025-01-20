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
      const nodemailer = (await import('nodemailer')).default;
      
      const requiredEnvVars = {
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_USERNAME: process.env.SMTP_USERNAME,
        SMTP_PASSWORD: process.env.SMTP_PASSWORD,
        SMTP_SENDER_EMAIL: process.env.SMTP_SENDER_EMAIL
      };

      const missingVars = Object.entries(requiredEnvVars)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missingVars.length > 0) {
        throw new Error(`缺少必要的環境變數: ${missingVars.join(', ')}`);
      }
      
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD
        }
      });

      await this.transporter.verify();
      
    } catch (error) {
      throw new Error('初始化郵件傳輸器失敗: ' + (error instanceof Error ? error.message : '未知錯誤'));
    }
  }

  async sendEmail(notification: EmailNotification): Promise<EmailResult> {
    try {
      if (typeof window !== 'undefined') {
        throw new Error('郵件發送只能在伺服器端執行');
      }

      if (!this.transporter) {
        await this.initializeTransporter();
      }

      await rateLimiter.acquire();

      const emailContent = notification.html;
      const mailOptions = {
        from: process.env.SMTP_SENDER_EMAIL,
        to: notification.to,
        subject: notification.subject,
        html: emailContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      return { 
        success: true, 
        error: null, 
        messageId: info.messageId 
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      
      if (errorMessage.includes('535 Authentication')) {
        return {
          success: false,
          error: 'SMTP 認證失敗，請檢查 SMTP 用戶名和密碼是否正確'
        };
      }
      
      return { 
        success: false, 
        error: errorMessage
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
