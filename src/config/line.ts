// config/line.ts
import { LineConfig } from '../types/lineTypes';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';
dotenv.config();

export const lineConfig: LineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  apiUrl: 'https://api.line.me/v2/bot',
  webhookUrl: process.env.NODE_ENV === 'production'
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/line/webhook`
    : process.env.NGROK_URL 
      ? `${process.env.NGROK_URL}/api/line/webhook`
      : '/api/line/webhook',
  basicId: process.env.NEXT_PUBLIC_LINE_BASIC_ID || '',
  qrCodeUrl: process.env.NEXT_PUBLIC_LINE_QR_CODE_URL || '',
  officialAccountName: process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_NAME || '',

  validateConfig() {
    logger.info('正在驗證 LINE 配置', {
      environment: process.env.NODE_ENV,
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      hasToken: !!this.channelAccessToken,
      hasSecret: !!this.channelSecret,
      webhookUrl: this.webhookUrl,
      basicId: this.basicId
    });

    if (!this.channelAccessToken) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKEN 未設定');
    }
    if (!this.channelSecret) {
      throw new Error('LINE_CHANNEL_SECRET 未設定');
    }
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
      throw new Error('生產環境中 NEXT_PUBLIC_API_URL 未設定');
    }
  }
};

// 檢查 LINE 設定是否完整
export const validateLineConfig = (): boolean => {
  try {
    logger.info('開始驗證 LINE 配置', {
      environment: process.env.NODE_ENV,
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      webhookUrl: lineConfig.webhookUrl
    });

    if (process.env.NODE_ENV === 'production') {
      if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET) {
        logger.error('生產環境缺少必要的 LINE 配置');
        return false;
      }
      if (!process.env.NEXT_PUBLIC_API_URL) {
        logger.error('生產環境缺少 API URL 配置');
        return false;
      }
    } else {
      if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET) {
        logger.warn('開發環境中缺少 LINE 配置，部分功能將被禁用');
        return false;
      }
    }
    
    logger.info('LINE 配置驗證成功');
    return true;
  } catch (error) {
    logger.error('LINE 配置驗證失敗:', error);
    return false;
  }
};

export const isLineConfigValid = validateLineConfig();

// 驗證 webhook URL 設定
const validateWebhookUrl = () => {
  const currentWebhookUrl = lineConfig.webhookUrl;
  logger.info('當前 Webhook URL:', {
    url: currentWebhookUrl,
    environment: process.env.NODE_ENV,
    apiUrl: process.env.NEXT_PUBLIC_API_URL
  });
  
  if (process.env.NODE_ENV === 'production') {
    if (!currentWebhookUrl.startsWith('https://')) {
      logger.error('生產環境 Webhook URL 必須使用 HTTPS');
      return false;
    }
  }
  
  return true;
};

export const isWebhookUrlValid = validateWebhookUrl();

// LINE 訊息相關常數
export const LINE_MESSAGE_MAX_LENGTH = 2000;
export const LINE_RETRY_COUNT = 3;
export const LINE_RETRY_DELAY = 1000;
