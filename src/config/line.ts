// config/line.ts
import { LineConfig } from '../types/lineTypes';

export const lineConfig: LineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  apiUrl: 'https://api.line.me/v2/bot',
  webhookUrl: process.env.NODE_ENV === 'development' 
    ? `${process.env.NGROK_URL || ''}/api/line/webhook`
    : `${process.env.NEXT_PUBLIC_API_URL || ''}/api/line/webhook`,
  basicId: process.env.NEXT_PUBLIC_LINE_BASIC_ID || '',
  qrCodeUrl: process.env.NEXT_PUBLIC_LINE_QR_CODE_URL || '',
  officialAccountName: process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_NAME || ''
};

// 添加環境變數檢查函數
const checkEnvVariables = () => {
  const envStatus = {
    NODE_ENV: process.env.NODE_ENV,
    ENV_FILE_LOADED: '已載入',
    LINE_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN ? '已設置' : '未設置',
    LINE_SECRET: process.env.LINE_CHANNEL_SECRET ? '已設置' : '未設置',
    TOKEN_LENGTH: process.env.LINE_CHANNEL_ACCESS_TOKEN?.length || 0,
    SECRET_LENGTH: process.env.LINE_CHANNEL_SECRET?.length || 0,
    WEBHOOK_URL: process.env.NODE_ENV === 'development'
      ? `${process.env.NGROK_URL || ''}/api/line/webhook`
      : `${process.env.NEXT_PUBLIC_API_URL || ''}/api/line/webhook`,
  };

  console.log('環境變數載入狀態：', envStatus);

  // 改進 Webhook URL 檢查邏輯
  if (process.env.NODE_ENV === 'development') {
    if (!process.env.NGROK_URL) {
      console.warn('⚠️ 開發環境中未設置 NGROK_URL，請按照以下步驟設置：');
      console.warn('1. 安裝 ngrok: npm install ngrok -D');
      console.warn('2. 啟動 ngrok: npx ngrok http 3000');
      console.warn('3. 將生成的 URL 設置到 .env.local 中：');
      console.warn('   NGROK_URL=https://你的ngrok網址');
      console.warn('4. 在 LINE Developers Console 中更新 Webhook URL');
    } else {
      const webhookUrl = `${process.env.NGROK_URL}/api/line/webhook`;
      console.log('✅ 開發環境 Webhook URL:', webhookUrl);
      console.log('請確保此 URL 已在 LINE Developers Console 中設置');
    }
  }

  // 檢查選填的環境變數
  const optionalVars = {
    NEXT_PUBLIC_LINE_BASIC_ID: process.env.NEXT_PUBLIC_LINE_BASIC_ID,
    NEXT_PUBLIC_LINE_QR_CODE_URL: process.env.NEXT_PUBLIC_LINE_QR_CODE_URL,
    NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_NAME: process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_NAME
  };

  const missingOptionalVars = Object.entries(optionalVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingOptionalVars.length > 0) {
    console.info('ℹ️ 以下選填的環境變數未設置：', missingOptionalVars.join('、'));
  }

  return envStatus;
};

const validateLineConfig = () => {
  const requiredVars = {
    LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
    NEXT_PUBLIC_LINE_BASIC_ID: process.env.NEXT_PUBLIC_LINE_BASIC_ID
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('缺少必要的 LINE 環境變數:', missingVars.join(', '));
    return false;
  }

  return true;
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