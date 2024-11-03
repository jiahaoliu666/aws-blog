// services/lineService.ts
import { lineConfig } from '../config/line';
import { generateArticleTemplate } from '../utils/lineTemplates';
import { ArticleData } from '../types/lineTypes';
import { logger } from '../utils/logger';

export async function sendArticleNotification(articleData: ArticleData) {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/multicast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineConfig.channelAccessToken}`
      },
      body: JSON.stringify({
        to: articleData.lineUserIds,
        messages: [generateArticleTemplate(articleData)]
      })
    });

    if (!response.ok) {
      throw new Error(`Line API responded with status: ${response.status}`);
    }

    logger.info('Line 通知發送成功');
    return true;
  } catch (error) {
    logger.error('發送 Line 通知時發生錯誤:', error);
    return false;
  }
}

export const lineService = {
  handleFollow: async (userId: string) => {
    // implementation
  },
  handleUnfollow: async (userId: string) => {
    // implementation
  }
};