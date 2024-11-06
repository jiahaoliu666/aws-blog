import { EmailNotification } from '../types/emailTypes';
import { sendEmailNotification } from '../services/emailService';
import { logger } from './logger';

interface FailedNotification {
  userId: string;
  articleId: string;
  email: string;
  retryCount: number;
}

export const failedNotifications: FailedNotification[] = [];

export async function processFailedNotifications(): Promise<void> {
  const maxRetries = 3;
  
  for (const notification of [...failedNotifications]) {
    if (notification.retryCount >= maxRetries) {
      failedNotifications.splice(failedNotifications.indexOf(notification), 1);
      continue;
    }

    try {
      // 處理失敗的通知
      failedNotifications.splice(failedNotifications.indexOf(notification), 1);
    } catch (error) {
      notification.retryCount++;
      logger.error('處理失敗的通知時發生錯誤:', error);
    }
  }
}

export async function sendEmailWithRetry(emailData: EmailNotification, maxRetries = 3): Promise<void> {
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      await sendEmailNotification(emailData);
      return;
    } catch (error) {
      retryCount++;
      if (retryCount === maxRetries) {
        logger.error(`發送郵件失敗，已重試 ${maxRetries} 次:`, error);
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
} 