// config/line.ts
import { LineConfig } from '../types/lineTypes';

export const lineConfig: LineConfig = {
  channelAccessToken: process.env.NEXT_PUBLIC_LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.NEXT_PUBLIC_LINE_CHANNEL_SECRET || '',
  webhookUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/line/webhook`,
  basicId: process.env.NEXT_PUBLIC_LINE_BASIC_ID || '',
  qrCodeUrl: `https://line.me/R/ti/p/@${process.env.NEXT_PUBLIC_LINE_BASIC_ID}`
};

// 添加環境變數檢查
if (!lineConfig.channelAccessToken) {
  console.error('警告: LINE Channel Access Token 未設定');
}

if (!lineConfig.channelSecret) {
  console.error('警告: LINE Channel Secret 未設定');
}

export const LINE_MESSAGE_MAX_LENGTH = 2000;
export const LINE_RETRY_COUNT = 3;
export const LINE_RETRY_DELAY = 1000; // milliseconds