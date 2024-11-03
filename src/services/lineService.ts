// services/lineService.ts
import { lineConfig } from '../config/line';
import { generateArticleTemplate } from '../templates/lineTemplates';
import { ArticleData } from '../types/lineTypes';
import { logger } from '../utils/logger';
import axios from 'axios';

export async function sendArticleNotification(articleData: ArticleData) {
  try {
    if (!articleData.lineUserIds || !Array.isArray(articleData.lineUserIds) || articleData.lineUserIds.length === 0) {
      logger.warn('沒有可發送的 Line 用戶');
      return false;
    }

    const response = await fetch('https://api.line.me/v2/bot/message/multicast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineConfig.channelAccessToken}`
      },
      body: JSON.stringify({
        to: articleData.lineUserIds,
        messages: [generateArticleTemplate({
          title: articleData.title,
          link: articleData.link,
          timestamp: typeof articleData.timestamp === 'string' 
            ? new Date(articleData.timestamp).getTime() 
            : Number(articleData.timestamp),
          summary: articleData.summary
        })]
      })
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      logger.error('Line API 錯誤回應:', {
        status: response.status,
        body: errorBody,
        requestData: {
          userCount: articleData.lineUserIds.length,
          title: articleData.title
        }
      });
      throw new Error(`Line API responded with status: ${response.status}, body: ${errorBody}`);
    }

    logger.info('Line 通知發送成功', {
      userCount: articleData.lineUserIds.length,
      title: articleData.title
    });
    return true;
  } catch (error) {
    logger.error('發送 Line 通知時發生錯誤:', {
      error: error instanceof Error ? error.message : String(error),
      articleData: {
        title: articleData.title,
        userCount: articleData.lineUserIds?.length
      }
    });
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

export const checkLineFollowStatus = async (lineId: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.line.me/v2/bot/profile/${lineId}`,
      {
        headers: {
          Authorization: `Bearer ${lineConfig.channelAccessToken}`,
        },
      }
    );

    if (response.ok) {
      return true;
    }

    const error = await response.json();
    if (error.message?.includes('not found')) {
      logger.info(`用戶 ${lineId} 未追蹤官方帳號`);
      return false;
    }

    throw new Error(error.message);
  } catch (error) {
    logger.error('檢查 LINE 追蹤狀態時發生錯誤:', error);
    return false;
  }
};