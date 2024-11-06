// config/line.ts
import { LineConfig } from '../types/lineTypes';

export const lineConfig: LineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  apiUrl: 'https://api.line.me/v2/bot',
  // 開發環境特別處理
  webhookUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/line/webhook`,
  basicId: process.env.NEXT_PUBLIC_LINE_BASIC_ID || '',
  qrCodeUrl: process.env.NEXT_PUBLIC_LINE_QR_CODE_URL || '',
  officialAccountName: process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_NAME || ''
};

// 改進環境變數檢查邏輯
const validateLineConfig = () => {
  const missingVars = [];
  
  if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    missingVars.push('LINE_CHANNEL_ACCESS_TOKEN');
  }
  
  if (!process.env.LINE_CHANNEL_SECRET) {
    missingVars.push('LINE_CHANNEL_SECRET');
  }
  
  if (process.env.NODE_ENV === 'development') {
    if (!process.env.NGROK_URL) {
      console.warn('⚠️ 開發環境提示: 請設置 NGROK_URL 以接收 LINE Webhook 事件');
    }
  } else if (missingVars.length > 0) {
    // 只在非開發環境拋出錯誤
    throw new Error(`❌ LINE 設定錯誤: 以下環境變數未設定: ${missingVars.join(', ')}`);
  }
};

// 執行驗證
validateLineConfig();

export const LINE_MESSAGE_MAX_LENGTH = 2000;
export const LINE_RETRY_COUNT = 3;
export const LINE_RETRY_DELAY = 1000; // milliseconds