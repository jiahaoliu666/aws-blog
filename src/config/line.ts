// config/line.ts
import { LineConfig } from '../types/lineTypes';
// 添加 logger 導入
import { logger } from '../utils/logger';

export const lineConfig: LineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  apiUrl: 'https://api.line.me/v2/bot',
  webhookUrl: process.env.NODE_ENV === 'development' 
    ? process.env.NGROK_URL 
      ? `${process.env.NGROK_URL}/api/line/webhook`
      : '/api/line/webhook'
    : `${process.env.NEXT_PUBLIC_API_URL || ''}/api/line/webhook`,
  basicId: process.env.NEXT_PUBLIC_LINE_BASIC_ID || '',
  qrCodeUrl: process.env.NEXT_PUBLIC_LINE_QR_CODE_URL || '',
  officialAccountName: process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_NAME || ''
};

// 添加環境變數檢查函數
const checkEnvVariables = () => {
  const envStatus = {
    NODE_ENV: process.env.NODE_ENV,
    ENV_FILE_LOADED: process.env.LINE_CHANNEL_ACCESS_TOKEN ? '已載入' : '未載入',
    LINE_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN ? '已設置' : '未設置',
    LINE_SECRET: process.env.LINE_CHANNEL_SECRET ? '已設置' : '未設置',
    TOKEN_LENGTH: process.env.LINE_CHANNEL_ACCESS_TOKEN?.length || 0,
    SECRET_LENGTH: process.env.LINE_CHANNEL_SECRET?.length || 0
  };

  // 添加更詳細的日誌
  console.log('LINE 配置狀態:', {
    ...envStatus,
    webhookUrl: lineConfig.webhookUrl
  });

  return envStatus;
};

// 修改驗證函數以返回布林值
export const validateLineConfig = (): boolean => {
  try {
    const requiredEnvVars = [
      'LINE_CHANNEL_ACCESS_TOKEN',
      'LINE_CHANNEL_SECRET',
      'LINE_API_URL'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`缺少必要的環境變數: ${missingVars.join(', ')}`);
    }

    // 驗證 token 格式
    if (process.env.LINE_CHANNEL_ACCESS_TOKEN!.length < 100) {
      throw new Error('LINE Channel Access Token 格式不正確');
    }

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// 在配置導出前進行驗證
if (!validateLineConfig()) {
  console.warn('LINE 配置驗證失敗，部分功能可能無法正常運作');
}

export const lineConfigValidation = validateLineConfig();

// 直接使用 lineConfigValidation，因為它本身就是一個布林值
export const isLineConfigValid = lineConfigValidation;

if (!isLineConfigValid) {
  console.warn('⚠️ LINE 設定驗證失敗，部分功能可能無法正常運作。請確認環境變數設定是否正確。');
}

export const LINE_MESSAGE_MAX_LENGTH = 2000;
export const LINE_RETRY_COUNT = 3;
export const LINE_RETRY_DELAY = 1000; // milliseconds

const validateWebhookUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    const ngrokUrl = process.env.NGROK_URL;
    if (!ngrokUrl) {
      return {
        isValid: false,
        message: '開發環境需要設置 NGROK_URL'
      };
    }
    return {
      isValid: true,
      url: `${ngrokUrl}/api/line/webhook`
    };
  }
  
  // 生產環境使用 NEXT_PUBLIC_API_URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return {
      isValid: false,
      message: '生產環境需要設置 NEXT_PUBLIC_API_URL'
    };
  }
  return {
    isValid: true,
    url: `${apiUrl}/api/line/webhook`
  };
};

// 新增驗證 LINE 配置的函數
export const validateLineMessagingConfig = () => {
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    throw new Error('LINE Channel Access Token 未設置');
  }
  if (!process.env.LINE_CHANNEL_SECRET) {
    throw new Error('LINE Channel Secret 未設置');
  }
  
  // 驗證 token 格式
  if (process.env.LINE_CHANNEL_ACCESS_TOKEN.length < 100) {
    throw new Error('LINE Channel Access Token 格式不正確');
  }
};

// 修改環境變數檢查函數，返回驗證結果而不是直接拋出錯誤
const validateEnvironment = () => {
  const required = [
    'LINE_CHANNEL_ACCESS_TOKEN',
    'LINE_CHANNEL_SECRET',
    'NEXT_PUBLIC_LINE_BASIC_ID'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.warn('缺少必要的環境變數:', missing);
    return {
      isValid: false,
      missing
    };
  }

  return {
    isValid: true,
    missing: []
  };
};

// 導出驗證結果供其他模組使用
export const environmentValidation = validateEnvironment();

// 移除直接調用 validateEnvironment()