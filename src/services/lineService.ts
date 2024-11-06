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
  },

  async getFollowers(): Promise<string[]> {
    try {
      validateLineMessagingConfig();
      
      const params = {
        TableName: "AWS_Blog_UserNotificationSettings",
        FilterExpression: "isFollowing = :isFollowing",
        ExpressionAttributeValues: {
          ":isFollowing": { BOOL: true }
        }
      };

      const command = new ScanCommand(params);
      const result = await dynamoClient.send(command);
      
      return result.Items?.map(item => item.lineId.S).filter(Boolean) as string[] || [];
    } catch (error) {
      logger.error('獲取追蹤者清單失敗:', error);
      throw error;
    }
  },

  async sendMulticast(message: string | LineMessage): Promise<{ success: boolean; message: string }> {
    try {
      validateLineMessagingConfig();

      // 獲取所有追蹤者的 LINE ID
      const followers = await this.getFollowers();
      
      if (followers.length === 0) {
        return {
          success: false,
          message: '目前沒有追蹤者'
        };
      }

      // 將訊息格式化為 LINE Message 物件
      const messageObject = typeof message === 'string' 
        ? { type: 'text', text: message }
        : message;

      // 分批發送（LINE 限制每次最多 500 個收件者）
      const batchSize = 500;
      for (let i = 0; i < followers.length; i += batchSize) {
        const batch = followers.slice(i, i + batchSize);
        
        const response = await fetch(`${lineConfig.apiUrl}/message/multicast`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lineConfig.channelAccessToken}`
          },
          body: JSON.stringify({
            to: batch,
            messages: [messageObject]
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || '發送失敗');
        }

        // 記錄發送日誌
        logger.info('成功發送群發訊息', {
          recipientCount: batch.length,
          batchNumber: Math.floor(i / batchSize) + 1,
          totalBatches: Math.ceil(followers.length / batchSize)
        });

        // 如果有多批次，等待一小段時間再發送下一批
        if (followers.length > batchSize && i + batchSize < followers.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return {
        success: true,
        message: `成功發送給 ${followers.length} 位追蹤者`
      };
    } catch (error) {
      logger.error('發送群發訊息失敗:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '發送失敗'
      };
    }
  },

  async sendMulticastWithTemplate(articleData: ArticleData): Promise<{ success: boolean; message: string }> {
    try {
      const template = createNewsNotificationTemplate({
        ...articleData,
        timestamp: new Date(articleData.timestamp).getTime().toString()
      });

      // 使用一般的 multicast 方法發送模板訊息
      return await this.sendMulticast(template);
    } catch (error) {
      logger.error('發送模板群發訊息失敗:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '發送失敗'
      };
    }
  },

  // 新增一個方法來更新追蹤者狀態
  async updateFollowerStatus(lineId: string, isFollowing: boolean): Promise<void> {
    try {
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
      logger.info(`已更新用戶 ${lineId} 的追蹤狀態為 ${isFollowing}`);
    } catch (error) {
      logger.error('更新追蹤者狀態失敗:', error);
      throw error;
    }
  },

  async requestVerification(lineId: string, userId: string): Promise<{ success: boolean; verificationCode: string }> {
    try {
      // 生成驗證碼
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // 儲存驗證碼到 DynamoDB
      const params = {
        TableName: "AWS_Blog_UserNotificationSettings",
        Item: {
          userId: { S: userId },
          lineId: { S: lineId },
          verificationCode: { S: verificationCode },
          verificationExpiry: { N: (Date.now() + 300000).toString() }, // 5分鐘過期
          isVerified: { BOOL: false },
          isFollowing: { BOOL: false },
          createdAt: { S: new Date().toISOString() }
        }
      };

      await dynamoClient.send(new PutItemCommand(params));

      return {
        success: true,
        verificationCode
      };
    } catch (error) {
      logger.error('請求驗證失敗:', error);
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