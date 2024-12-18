import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import axios, { AxiosError } from 'axios';
import { API_ENDPOINTS, ERROR_CODES, RETRY_CONFIG } from '@/config/constants';
import { logger } from '@/utils/logger';
import { AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import cognitoClient from '@/utils/cognitoClient';

// 新增 DynamoDB 客戶端配置
const dynamoClient = new DynamoDBClient({
  region: 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

// 新增創建用戶資料函數
const createUserProfile = async (userId: string) => {
  try {
    // 取得當前日期並格式化為 YYYY-MM-DD
    const registrationDate = new Date().toISOString().split('T')[0];

    const params = {
      TableName: 'AWS_Blog_UserProfiles',
      Item: {
        userId: { S: userId },
        avatarUrl: { S: 'https://aws-blog-avatar.s3.ap-northeast-1.amazonaws.com/user.png' },
        createdAt: { S: new Date().toISOString() },
        registrationDate: { S: registrationDate }  // 新增註冊日期欄位
      }
    };

    await dynamoClient.send(new PutItemCommand(params));
    logger.info('成功建立用���資料', { userId, registrationDate });
  } catch (error) {
    logger.error('建立用戶資料失敗', { error, userId });
    throw new Error('建立用戶資料失敗');
  }
};

// 新增創建用戶偏好設定函數
const createUserPreferences = async (userId: string) => {
  try {
    const params = {
      TableName: 'AWS_Blog_UserPreferences',
      Item: {
        userId: { S: userId },
        theme: { S: 'light' },
        language: { S: 'zh-TW' },
        viewMode: { S: 'list' },
        autoSummarize: { BOOL: false },
        createdAt: { S: new Date().toISOString() }
      }
    };

    await dynamoClient.send(new PutItemCommand(params));
    logger.info('成功建立用戶偏好設定', { userId });
  } catch (error) {
    logger.error('建立用戶偏好設定失敗', { error, userId });
    throw new Error('建立用戶偏好設定失敗');
  }
};

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
      // 如果是新用戶註冊，先建立 DynamoDB 資料
      if (data.isNewUser) {
        await createUserProfile(data.userId);
      }

      const response = await axios.put(API_ENDPOINTS.UPDATE_USER, data);
      return response.data;
    } catch (error) {
      logger.error('更新用戶資料', { error });
      throw handleApiError(error as AxiosError);
    }
  },

  deleteAccount: async ({ password, userId, userSub }: { 
    password: string;
    userId: string;
    userSub: string;
  }) => {
    try {
      const response = await axios.post(API_ENDPOINTS.DELETE_ACCOUNT, {
        password,
        userId,
        userSub
      });
      
      return response;
    } catch (error) {
      if (error instanceof AxiosError) {
        logger.error('刪除帳號失敗:', { error });
        if (error.response?.status === 401) {
          throw new Error('密碼錯誤，請重新輸入');
        }
        if (error.response?.status === 404) {
          throw new Error('找不到用戶資料');
        }
        if (error.response?.status === 500) {
          throw new Error('伺服器錯誤，請稍後重試');
        }
      }
      throw new Error('刪除帳號時發生錯誤，請稍後重試');
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
  },

  // 新增註冊成功後的處理方法
  handlePostRegistration: async (cognitoSub: string) => {
    try {
      // 建立用戶基本資料
      await createUserProfile(cognitoSub);
      // 建立用戶偏好設定
      await createUserPreferences(cognitoSub);
      logger.info('註冊後處理完成', { cognitoSub });
      return true;
    } catch (error) {
      logger.error('註冊後處理失敗', { error, cognitoSub });
      throw error;
    }
  },

  cleanupUnverifiedUser: async (email: string) => {
    try {
      const params = {
        UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
        Username: email
      };
      
      // 刪除 Cognito 用戶
      await cognitoClient.send(new AdminDeleteUserCommand(params));
      
      logger.info('成功清理未驗證用戶', { email });
    } catch (error) {
      logger.error('清理未驗證用戶失敗', { error, email });
      throw error;
    }
  },

  // 新增取得用戶資料的方法
  getUserProfile: async (userId: string) => {
    try {
      const params = {
        TableName: 'AWS_Blog_UserProfiles',
        Key: {
          userId: { S: userId }
        }
      };

      const response = await dynamoClient.send(new GetItemCommand(params));
      
      if (!response.Item) {
        throw new Error('找不到用戶資料');
      }

      return {
        registrationDate: response.Item.registrationDate.S,
        // ... 其他需要的欄位
      };
    } catch (error) {
      logger.error('取得用戶資料失敗', { error, userId });
      throw error;
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