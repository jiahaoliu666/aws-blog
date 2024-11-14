import { withRetry } from '@/utils/retryUtils';
import { logger } from '@/utils/logger';
import { VerificationResponse } from '@/types/lineTypes';

export const lineVerificationService = {
  async verifyCode(userId: string, code: string): Promise<VerificationResponse> {
    return withRetry(
      async () => {
        try {
          const response = await fetch('/api/line/verify-code', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, code }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || '驗證請求失敗');
          }

          return data;
        } catch (error) {
          logger.error('驗證碼驗證錯誤:', error);
          throw error;
        }
      },
      {
        operationName: 'LINE 驗證碼驗證',
        retryCount: 3,
        retryDelay: 1000
      }
    );
  },
  
  sendUserId: async (userId: string): Promise<VerificationResponse> => {
    const response = await fetch('/api/line/send-userid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    return response.json();
  },

  checkVerificationStatus: async (userId: string): Promise<VerificationResponse> => {
    return withRetry(
      async () => {
        try {
          const response = await fetch('/api/line/verification-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || '驗證狀態檢查失敗');
          }

          return data;
        } catch (error) {
          logger.error('驗證狀態檢查錯誤:', error);
          throw error;
        }
      },
      {
        operationName: 'LINE 驗證狀態檢查',
        retryCount: 3,
        retryDelay: 1000
      }
    );
  }
}; 