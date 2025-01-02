import { EmailNotification } from '../types/emailTypes';
import { sendEmailNotification } from '../services/emailService';
import { discordService } from '../services/discordService';
import { logger } from './logger';

interface FailedNotification {
  userId: string;
  articleId: string;
  type: string;
  error: string;
  email?: string;
  retryCount?: number;
  lastRetryTime?: number;
}

export const failedNotifications: FailedNotification[] = [];

const RETRY_DELAYS = [1000, 5000, 15000]; // 重試延遲時間（毫秒）

export async function processFailedNotifications(): Promise<void> {
  const maxRetries = 3;
  const currentTime = Date.now();
  
  for (let i = failedNotifications.length - 1; i >= 0; i--) {
    const notification = failedNotifications[i];
    const retryCount = notification.retryCount || 0;
    
    // 如果超過最大重試次數，移除該通知
    if (retryCount >= maxRetries) {
      logger.warn(`通知已達最大重試次數 (${maxRetries})，放棄重試:`, {
        userId: notification.userId,
        type: notification.type,
        error: notification.error
      });
      failedNotifications.splice(i, 1);
      continue;
    }

    // 檢查是否需要等待下一次重試
    const lastRetryTime = notification.lastRetryTime || 0;
    const retryDelay = RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
    if (currentTime - lastRetryTime < retryDelay) {
      continue;
    }

    try {
      let success = false;
      
      // 根據通知類型進行不同的重試處理
      switch (notification.type) {
        case 'discord':
          // 重試 Discord 通知
          success = await retryDiscordNotification(notification);
          break;
        case 'email':
          // 重試郵件通知
          if (notification.email) {
            await sendEmailWithRetry({
              to: notification.email,
              subject: '重試：AWS Blog 更新通知',
              text: `重試發送之前失敗的通知：${notification.articleId}`
            });
            success = true;
          }
          break;
        default:
          logger.warn(`未知的通知類型: ${notification.type}`);
          break;
      }

      if (success) {
        // 如果重試成功，移除該通知
        failedNotifications.splice(i, 1);
        logger.info(`成功重試通知:`, {
          userId: notification.userId,
          type: notification.type
        });
      } else {
        // 更新重試次數和時間
        notification.retryCount = retryCount + 1;
        notification.lastRetryTime = currentTime;
        logger.warn(`通知重試失敗 (${retryCount + 1}/${maxRetries}):`, {
          userId: notification.userId,
          type: notification.type,
          error: notification.error
        });
      }
    } catch (error) {
      // 更新重試次數和時間
      notification.retryCount = retryCount + 1;
      notification.lastRetryTime = currentTime;
      logger.error(`處理失敗的通知時發生錯誤:`, error);
    }
  }
}

async function retryDiscordNotification(notification: FailedNotification): Promise<boolean> {
  try {
    // 重新獲取文章內容
    const response = await fetch(`/api/content/${notification.articleId}`);
    if (!response.ok) {
      throw new Error('無法獲取文章內容');
    }
    
    const content = await response.json();
    
    // 重試發送 Discord 通知
    return await discordService.sendNotification(
      notification.userId,
      'ANNOUNCEMENT', // 這裡可能需要根據實際情況調整通知類型
      content.title,
      content.summary,
      content.link
    );
  } catch (error) {
    logger.error('重試 Discord 通知失敗:', error);
    return false;
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
      // 使用指數退避策略
      const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
} 