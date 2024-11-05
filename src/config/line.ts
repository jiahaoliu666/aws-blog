// config/line.ts
import { LineConfig } from '../types/lineTypes';

export const lineConfig: LineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  apiUrl: 'https://api.line.me/v2/bot',
  // 開發環境特別處理
  webhookUrl: process.env.NODE_ENV === 'development'
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/line/webhook`
    : process.env.LINE_WEBHOOK_URL || '',
  basicId: process.env.NEXT_PUBLIC_LINE_BASIC_ID || '',
  qrCodeUrl: process.env.NEXT_PUBLIC_LINE_QR_CODE_URL || '',
  officialAccountName: process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_NAME || ''
};

// 添加配置檢查
if (!lineConfig.channelAccessToken) {
  console.warn('LINE Channel Access Token 未設定');
}

if (!lineConfig.channelSecret) {
  console.warn('LINE Channel Secret 未設定');
}

export const LINE_MESSAGE_MAX_LENGTH = 2000;
export const LINE_RETRY_COUNT = 3;
export const LINE_RETRY_DELAY = 1000; // milliseconds

// 開發環境提示
if (process.env.NODE_ENV === 'development' && !process.env.NGROK_URL) {
  console.warn('開發環境建議設置 NGROK_URL 以接收 LINE Webhook 事件');
}