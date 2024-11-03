// config/line.ts
import { LineConfig } from '../types/lineTypes';

export const lineConfig: LineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  webhookUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/line/webhook`
};

// 添加設定檢查
if (!lineConfig.channelAccessToken) {
  throw new Error('LINE Channel Access Token is missing');
}

export const LINE_MESSAGE_MAX_LENGTH = 2000;
export const LINE_RETRY_COUNT = 3;
export const LINE_RETRY_DELAY = 1000; // milliseconds