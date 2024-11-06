// services/lineService.ts
import { lineConfig } from '../config/line';
import { createWelcomeTemplate, createNewsNotificationTemplate } from '../templates/lineTemplates';
import { DynamoDBClient, UpdateItemCommand, ScanCommand, PutItemCommand, QueryCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '../utils/logger';
import NodeCache from 'node-cache';
import { LineFollowStatus, ArticleData, LineMessage } from "../types/lineTypes";
import { createClient } from 'redis';

// 驗證 LINE 設定
const validateLineMessagingConfig = () => {
  if (!lineConfig.channelAccessToken) {
    throw new Error('未設定 LINE Channel Access Token');
  }
  if (!lineConfig.apiUrl) {
    throw new Error('未設定 LINE API URL');
  }
};

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });
const lineStatusCache = new NodeCache({ stdTTL: 300 }); // 5分鐘快取
const verificationCache = new NodeCache({ stdTTL: 600 }); // 10分鐘過期

const validateLineId = (lineId: string): boolean => {
    // 確保 lineId 存在且為字串
    if (!lineId || typeof lineId !== 'string') {
        return false;
    }
    
    // 移除可能的空白字元
    const trimmedId = lineId.trim();
    
    // 使用不區分大小寫的正則表達式驗證
    return /^U[0-9a-f]{32}$/i.test(trimmedId);
};

// 檢查 LINE 追蹤狀態
export const checkLineFollowStatus = async (userId: string): Promise<boolean> => {
  const cacheKey = `lineStatus:${userId}`;
  
  // 檢查快取
  const cachedStatus = lineStatusCache.get<boolean>(cacheKey);
  if (cachedStatus !== undefined) {
    return cachedStatus;
  }

  try {
    const response = await fetch(`/api/line/check-follow-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();
    
    // 儲存到快取
    lineStatusCache.set(cacheKey, data.isFollowing);
    
    return data.isFollowing;
  } catch (error) {
    console.error('檢查 LINE 追蹤狀態時發生錯誤:', error);
    return false;
  }
};

// 更新用戶的 LINE 狀態
const updateUserLineStatus = async (lineId: string, isFollowing: boolean) => {
  const params = {
    TableName: "AWS_Blog_UserNotificationSettings",
    Key: {
      lineId: { S: lineId }
    },
    UpdateExpression: "SET isFollowing = :isFollowing, updatedAt = :updatedAt",
    ExpressionAttributeValues: {
      ":isFollowing": { BOOL: isFollowing },
      ":updatedAt": { S: new Date().toISOString() }
    }
  };

  await dynamoClient.send(new UpdateItemCommand(params));
};

export const lineService = {
  async checkFollowStatus(lineId: string): Promise<LineFollowStatus> {
    try {
      validateLineMessagingConfig();
      
      const response = await fetch(`${lineConfig.apiUrl}/profile/${lineId}`, {
        headers: {
          Authorization: `Bearer ${lineConfig.channelAccessToken}`
        }
      });

      return {
        isFollowing: response.ok,
        message: response.ok ? '已追蹤官方帳號' : '尚未追蹤官方帳號',
        displayName: response.ok ? (await response.json()).displayName : ''
      };
    } catch (error) {
      logger.error('檢查 LINE 追蹤狀態時發生錯誤:', error);
      return {
        isFollowing: false,
        message: '檢查追蹤狀態時發生錯誤',
        displayName: ''
      };
    }
  },

  async updateUserLineSettings({ userId, lineId, isVerified }: {
    userId: string;
    lineId: string;
    isVerified: boolean;
  }) {
    try {
      const params = {
        TableName: 'AWS_Blog_UserNotificationSettings',
        Item: {
          userId: { S: userId },
          lineId: { S: lineId },
          isVerified: { BOOL: isVerified },
          updatedAt: { S: new Date().toISOString() }
        }
      };

      await dynamoClient.send(new PutItemCommand(params));
      logger.info('已更新用戶 LINE 設定', { userId, lineId, isVerified });
    } catch (error) {
      logger.error('更新用戶 LINE 設定失敗:', error);
      throw error;
    }
  },

  async getUserLineSettings(userId: string) {
    try {
      const params = {
        TableName: 'AWS_Blog_UserNotificationSettings',
        Key: {
          userId: { S: userId }
        }
      };

      const result = await dynamoClient.send(new GetItemCommand(params));
      return result.Item ? {
        lineId: result.Item.lineId.S,
        isVerified: result.Item.isVerified.BOOL
      } : null;
    } catch (error) {
      logger.error('獲取用戶 LINE 設定失敗:', error);
      throw error;
    }
  },

  async verifyCode(userId: string, code: string): Promise<boolean> {
    try {
      const response = await fetch('/api/line/verify/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, code }),
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('證碼確認失敗:', error);
      return false;
    }
  },

  async broadcastNewsNotification(articleData: ArticleData) {
    try {
      validateLineMessagingConfig();
      
      // 使用更人性化的範本
      const messages = [
        // 先發送友善的開場白
        {
          type: 'text',
          text: '👋 嗨！有新文章跟大家分享'
        },
        // 再發送文章資訊
        createNewsNotificationTemplate({
          ...articleData,
          timestamp: new Date(articleData.timestamp).getTime().toString()
        })
      ];

      const response = await fetch(`${lineConfig.apiUrl}/message/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lineConfig.channelAccessToken}`
        },
        body: JSON.stringify({ messages })
      });

      if (!response.ok) {
        throw new Error('發送廣播訊息失敗');
      }

      logger.info('成功發送新文章通知');
      return true;
    } catch (error) {
      logger.error('發送廣播訊息失敗:', error);
      throw error;
    }
  },

  async broadcastMessage(message: LineMessage | LineMessage[]) {
    try {
      validateLineMessagingConfig();
      
      const response = await fetch(`${lineConfig.apiUrl}/message/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lineConfig.channelAccessToken}`
        },
        body: JSON.stringify({
          messages: Array.isArray(message) ? message : [message]
        })
      });

      if (!response.ok) {
        throw new Error('發送廣播訊息失敗');
      }

      return true;
    } catch (error) {
      logger.error('發送廣播訊息失敗:', error);
      throw error;
    }
  },

  async sendNewsNotification(articleData: ArticleData) {
    try {
      const template = createNewsNotificationTemplate({
        ...articleData,
        timestamp: new Date(articleData.timestamp).getTime().toString()
      });
      return await this.broadcastMessage(template);
    } catch (error) {
      logger.error('發送新聞通知失敗:', error);
      throw error;
    }
  }
};

async function requestVerification(userId: string, lineId: string) {
  try {
    const response = await fetch('/api/line/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, lineId }),
    });

    if (!response.ok) {
      throw new Error('驗證請求失敗');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('發送驗求時發生錯誤:', error);
    throw error;
  }
}