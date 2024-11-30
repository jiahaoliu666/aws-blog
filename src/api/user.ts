import axios, { AxiosError } from 'axios';
import { API_ENDPOINTS, ERROR_CODES, RETRY_CONFIG } from '@/config/constants';
import { logger } from '@/utils/logger';

// 錯誤處理函數
const handleApiError = (error: AxiosError) => {
  if (error.response) {
    switch (error.response.status) {
      case ERROR_CODES.UNAUTHORIZED:
        throw new Error('密碼錯誤，請重新輸入');
      case ERROR_CODES.RATE_LIMIT:
        throw new Error('請求過於頻繁，請稍後再試');
      case ERROR_CODES.SERVER_ERROR:
        throw new Error('伺服器錯誤，請稍後重試');
      default:
        throw new Error('操作失敗，請稍後重試');
    }
  }
  throw new Error('網路連線錯誤，請檢查網路狀態');
};

interface DeleteAccountParams {
  password: string;
  user: {
    sub?: string;
    userId?: string;
    email?: string;
    username?: string;
  };
}

export const userApi = {
  updateUser: async (data: any) => {
    try {
      const response = await axios.put(API_ENDPOINTS.UPDATE_USER, data);
      return response.data;
    } catch (error) {
      logger.error('更新用戶資料���', { error });
      throw handleApiError(error as AxiosError);
    }
  },

  deleteAccount: async ({ password, user }: DeleteAccountParams) => {
    try {
      const response = await axios.post(
        API_ENDPOINTS.DELETE_ACCOUNT,
        { password },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.userId,
            'x-user-sub': user.sub,
            'x-user-email': user.email
          }
        }
      );
      return response.data;
    } catch (error) {
      logger.error('刪除帳號請求失敗:', error);
      if (axios.isAxiosError(error)) {
        switch (error.response?.status) {
          case 400:
            throw new Error('請求參數不完整，請重試');
          case 401:
            throw new Error('密碼錯誤，請重新輸入');
          case 404:
            throw new Error('用戶不存在');
          case 500:
            throw new Error('伺服器錯誤，請稍後重試');
          default:
            throw new Error('刪除帳號失敗，請稍後重試');
        }
      }
      throw error;
    }
  },

  updateAccountStatus: async (status: string) => {
    try {
      const response = await axios.patch(API_ENDPOINTS.UPDATE_STATUS, { status });
      return response.data;
    } catch (error) {
      logger.error('更新帳號狀態失敗', { error });
      throw handleApiError(error as AxiosError);
    }
  }
};

// 可以選擇性地保留 withRetry 裝飾器
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = RETRY_CONFIG.MAX_RETRIES
): Promise<T> => {
  let lastError: Error = new Error('Initial error');
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxRetries - 1) break;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }
  throw lastError;
}; 