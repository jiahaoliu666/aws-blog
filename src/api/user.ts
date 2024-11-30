import axios, { AxiosError } from 'axios';
import { API_ENDPOINTS, ERROR_CODES, RETRY_CONFIG } from '@/config/constants';
import { logger } from '@/utils/logger';

// 錯誤處理函數
const handleApiError = (error: AxiosError) => {
  if (error.response) {
    switch (error.response.status) {
      case ERROR_CODES.UNAUTHORIZED:
        throw new Error('密碼錯誤，請重新輸入');
      case ERROR_CODES.NOT_FOUND:
        throw new Error('找不到用戶資料');
      case ERROR_CODES.RATE_LIMIT:
        throw new Error('請求過於頻繁，請稍後再試');
      case ERROR_CODES.SERVER_ERROR:
        throw new Error('伺服器錯誤，請稍後重試');
      default:
        throw new Error('操作失敗，請稍後重試');
    }
  }
  throw error;
};

// 首先定義介面
interface DeleteAccountParams {
  password: string;
  user: {
    sub: string;
    userId: string;
    email: string;
  };
}

export const userApi = {
  updateUser: async (data: any) => {
    try {
      const response = await axios.put(API_ENDPOINTS.UPDATE_USER, data);
      return response.data;
    } catch (error) {
      logger.error('更新用戶資料', { error });
      throw handleApiError(error as AxiosError);
    }
  },

  deleteAccount: async (password: string) => {
    try {
      logger.info('開始刪除帳號流程');
      const response = await axios.post(API_ENDPOINTS.DELETE_ACCOUNT, { password });
      logger.info('帳號刪除成功');
      return response.data;
    } catch (error) {
      logger.error('刪除帳號失敗:', error);
      if (error instanceof AxiosError) {
        switch (error.response?.status) {
          case ERROR_CODES.UNAUTHORIZED:
            throw new Error('密碼錯誤，請重新輸入');
          case ERROR_CODES.NOT_FOUND:
            throw new Error('找不到用戶資料');
          case ERROR_CODES.RATE_LIMIT:
            throw new Error('請求過於頻繁，請稍後再試');
          case ERROR_CODES.SERVER_ERROR:
            throw new Error('伺服器錯誤，請稍後重試');
          default:
            throw new Error('刪除帳號時發生錯誤');
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