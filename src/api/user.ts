import axios, { AxiosError } from 'axios';
import { API_ENDPOINTS, ERROR_CODES, RETRY_CONFIG } from '@/config/constants';
import { logger } from '@/utils/logger';

// 錯誤處理函數
const handleApiError = (error: AxiosError) => {
  if (error.response) {
    switch (error.response.status) {
      case ERROR_CODES.UNAUTHORIZED:
        throw new Error('未授權的請求或密碼錯誤');
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

export const api = {
  updateUser: async (data: any) => {
    try {
      const response = await axios.put(API_ENDPOINTS.UPDATE_USER, data);
      return response.data;
    } catch (error) {
      logger.error('更新用戶資料失敗', { error });
      throw handleApiError(error as AxiosError);
    }
  },

  deleteAccount: async (password: string) => {
    try {
      logger.info('開始刪除帳號流程');
      
      // 從 localStorage 獲取用戶資訊
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        logger.error('未找到用戶資訊');
        throw new Error('未找到用戶資訊');
      }

      const user = JSON.parse(userStr);
      logger.info('用戶資訊檢查:', { 
        hasEmail: !!user.email,
        hasAccessToken: !!user.accessToken 
      });

      const response = await axios.delete(API_ENDPOINTS.DELETE_ACCOUNT, {
        data: { 
          password,
          email: user.email
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.accessToken || ''}`
        }
      }).catch((error) => {
        logger.error('API 請求失敗:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        });
        throw error;
      });

      logger.info('刪除帳號 API 響應:', { 
        status: response.status,
        success: response.data?.success 
      });
      
      return response.data;
    } catch (error: any) {
      logger.error('刪除帳號失敗:', {
        errorMessage: error.message,
        errorName: error.name,
        status: error.response?.status,
        responseData: error.response?.data
      });

      // 根據錯誤狀態返回適當的錯誤訊息
      if (error.response?.status === 500) {
        throw new Error('伺服器處理請求時發生錯誤，請稍後重試');
      } else if (error.response?.status === 401) {
        throw new Error('密碼錯誤或未授權，請確認後重試');
      } else if (error.response?.status === 404) {
        throw new Error('找不到指定的用戶');
      }
      
      throw new Error(error.response?.data?.message || '刪除帳號時發生錯誤，請稍後重試');
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