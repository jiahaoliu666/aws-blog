// config/line.ts
import { LineConfig } from '../types/lineTypes';
// 添加 logger 導入
import { logger } from '../utils/logger';
import dotenv from 'dotenv';
dotenv.config();

export const lineConfig: LineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  apiUrl: 'https://api.line.me/v2/bot',
  webhookUrl: process.env.NODE_ENV === 'development' 
    ? `${process.env.NGROK_URL || ''}/api/line/webhook`
    : `${process.env.NEXT_PUBLIC_API_URL || ''}/api/line/webhook`,
  basicId: process.env.NEXT_PUBLIC_LINE_BASIC_ID || '',
  qrCodeUrl: process.env.NEXT_PUBLIC_LINE_QR_CODE_URL || '',
  officialAccountName: process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_NAME || '',

  // 添加配置驗證
  validateConfig() {
    if (!this.channelAccessToken) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKEN 未設定');
    }
    if (!this.channelSecret) {
      throw new Error('LINE_CHANNEL_SECRET 未設定');
    }
  }
};

// 檢查 LINE 設定是否完整
if (!lineConfig.channelAccessToken || !lineConfig.channelSecret) {
  logger.error('LINE 設定不完整:', {
    hasToken: !!lineConfig.channelAccessToken,
    hasSecret: !!lineConfig.channelSecret
  });
}

// 簡化驗證函數
export const validateLineConfig = (): boolean => {
  const envStatus = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET
  };

  // 記錄環境變數狀態
  logger.info('LINE 配置狀態:', {
    tokenExists: !!envStatus.channelAccessToken,
    secretExists: !!envStatus.channelSecret,
    nodeEnv: process.env.NODE_ENV
  });

  // 如果在開發環境，使用警告而不是錯誤
  if (process.env.NODE_ENV === 'development') {
    if (!envStatus.channelAccessToken || !envStatus.channelSecret) {
      logger.warn('開發環境中缺少 LINE 配置，部分功能可能無法使用');
      return false;
    }
  } else {
    // 在生產環境中強制要求配置
    if (!envStatus.channelAccessToken || !envStatus.channelSecret) {
      throw new Error(
        '缺少必要的 LINE 環境變數: ' + 
        [
          !envStatus.channelAccessToken && 'LINE_CHANNEL_ACCESS_TOKEN',
          !envStatus.channelSecret && 'LINE_CHANNEL_SECRET'
        ].filter(Boolean).join(', ')
      );
    }
  }

  return true;
};

export const isLineConfigValid = validateLineConfig();

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
