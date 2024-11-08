// services/lineService.ts
import { lineConfig } from '../config/line';
import { createWelcomeTemplate, createNewsNotificationTemplate } from '../templates/lineTemplates';
import { DynamoDBClient, UpdateItemCommand, ScanCommand, PutItemCommand, QueryCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '../utils/logger';
import NodeCache from 'node-cache';
import { LineFollowStatus, ArticleData, LineMessage, LineWebhookEvent, LineUserSettings, VerificationState, LineApiResponse } from "../types/lineTypes";
import { createClient } from 'redis';
import crypto from 'crypto';
import axios from 'axios';

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
    // 確保 lineId 存在且為串
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

interface LineServiceInterface {
  sendMessage(lineId: string, message: string | LineMessage): Promise<boolean>;
  sendWelcomeMessage(lineId: string): Promise<boolean>;
  broadcastMessage(message: LineMessage | LineMessage[]): Promise<LineApiResponse>;
  sendMulticast(message: string | LineMessage): Promise<LineApiResponse>;
  sendMulticastWithTemplate(articleData: ArticleData): Promise<LineApiResponse>;
  updateFollowerStatus(lineId: string, isFollowing: boolean): Promise<void>;
  requestVerification(lineId: string, userId: string): Promise<{ success: boolean; verificationCode: string }>;
  verifyCode(userId: string, code: string): Promise<{ success: boolean; message?: string }>;
  getFollowers(): Promise<string[]>;
  checkFollowStatus(lineUserId: string): Promise<LineFollowStatus>;
  updateUserLineSettings(params: { userId: string; lineId: string; isVerified: boolean }): Promise<void>;
  getUserLineSettings(userId: string): Promise<{ lineId: string; isVerified: boolean } | null>;
  broadcastNewsNotification(articleData: ArticleData): Promise<boolean>;
  sendNewsNotification(articleData: ArticleData): Promise<LineApiResponse>;
  generateVerificationCode(userId: string, lineId: string): Promise<string>;
  updateNotificationSettings(userId: string, settings: {
    lineNotification: boolean;
    lineId?: string;
  }): Promise<void>;
  replyMessage(replyToken: string, message: LineMessage): Promise<void>;
}

export class LineService implements LineServiceInterface {
  private headers: { [key: string]: string };

  constructor() {
    validateLineMessagingConfig();
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${lineConfig.channelAccessToken}`
    };
  }

  async replyMessage(replyToken: string, message: any) {
    try {
      const response = await fetch(`${lineConfig.apiUrl}/message/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lineConfig.channelAccessToken}`
        },
        body: JSON.stringify({
          replyToken,
          messages: [message]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('LINE API 回覆訊息失敗:', errorData);
        throw new Error(`LINE API 錯誤: ${errorData.message}`);
      }

      return response.json();
    } catch (error) {
      logger.error('發送 LINE 回覆時發生錯誤:', error);
      throw error;
    }
  }

  async sendWelcomeMessage(lineId: string): Promise<boolean> {
    try {
      const message = {
        type: 'text' as const,
        text: '歡迎加入！請在聊天室中輸入「驗證」取得您的 LINE ID 和驗證碼。'
      };

      await this.pushMessage(lineId, message);
      logger.info('歡迎訊息發送成功', { lineId });
      return true;
    } catch (error) {
      logger.error('發送歡迎訊息失敗:', error);
      return false;
    }
  }

  private async pushMessage(to: string, message: LineMessage): Promise<void> {
    try {
      const response = await fetch(`${lineConfig.apiUrl}/message/push`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          to,
          messages: [message]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`LINE API 錯誤: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      logger.error('推送 LINE 訊息失敗:', error);
      throw error;
    }
  }

  async checkFollowStatus(lineUserId: string): Promise<LineFollowStatus> {
    try {
      const response = await fetch(`${lineConfig.apiUrl}/friendship/status`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error('檢查追蹤狀態失敗');
      }

      const data = await response.json();
      return {
        isFollowing: data.friendFlag === true,
        timestamp: new Date().toISOString(),
        followed: data.friendFlag === true,
        message: '',
        displayName: ''
      };
    } catch (error) {
      logger.error('檢查 LINE 追蹤狀態失敗:', error);
      return {
        isFollowing: false,
        timestamp: new Date().toISOString(),
        followed: false,
        message: '檢查失敗',
        displayName: ''
      };
    }
  }

  async sendMessage(lineId: string, message: string | LineMessage): Promise<boolean> {
    try {
      const messageObj = typeof message === 'string' ? { type: 'text' as const, text: message } : message;
      await this.pushMessage(lineId, messageObj);
      return true;
    } catch (error) {
      logger.error('發送訊息失敗:', error);
      return false;
    }
  }

  async broadcastMessage(message: LineMessage | LineMessage[]): Promise<LineApiResponse> {
    // ... 實作廣播訊息邏輯 ...
    throw new Error('Method not implemented.');
  }

  async sendMulticast(message: string | LineMessage): Promise<LineApiResponse> {
    // ... 實作多人發送邏輯 ...
    throw new Error('Method not implemented.');
  }

  async sendMulticastWithTemplate(articleData: ArticleData): Promise<LineApiResponse> {
    // ... 實作多人發送範本邏輯 ...
    throw new Error('Method not implemented.');
  }

  async updateFollowerStatus(lineId: string, isFollowing: boolean): Promise<void> {
    // ... 實作更新追蹤狀態邏輯 ...
    throw new Error('Method not implemented.');
  }

  async requestVerification(lineId: string, userId: string): Promise<{ success: boolean; verificationCode: string }> {
    // ... 實作驗證碼生成邏輯 ...
    throw new Error('Method not implemented.');
  }

  async verifyCode(userId: string, code: string): Promise<{ success: boolean; message?: string }> {
    // ... 實作驗證碼驗證邏輯 ...
    throw new Error('Method not implemented.');
  }

  async getFollowers(): Promise<string[]> {
    // ... 實作獲取追蹤者列表邏輯 ...
    throw new Error('Method not implemented.');
  }

  async updateUserLineSettings(params: { userId: string; lineId: string; isVerified: boolean }): Promise<void> {
    // ... 實作更新用戶 LINE 設定邏輯 ...
    throw new Error('Method not implemented.');
  }

  async getUserLineSettings(userId: string): Promise<{ lineId: string; isVerified: boolean } | null> {
    // ... 實作獲取用戶 LINE 設定邏輯 ...
    throw new Error('Method not implemented.');
  }

  async broadcastNewsNotification(articleData: ArticleData): Promise<boolean> {
    // ... 實作廣播新聞通知邏輯 ...
    throw new Error('Method not implemented.');
  }

  async sendNewsNotification(articleData: ArticleData): Promise<LineApiResponse> {
    // ... 實作發送新聞通知邏輯 ...
    throw new Error('Method not implemented.');
  }

  async generateVerificationCode(userId: string, lineId: string): Promise<string> {
    // ... 實作驗證碼生成邏輯 ...
    throw new Error('Method not implemented.');
  }

  async updateNotificationSettings(userId: string, settings: {
    lineNotification: boolean;
    lineId?: string;
  }): Promise<void> {
    // ... 實作更新通知設定邏輯 ...
    throw new Error('Method not implemented.');
  }
}

export const lineService = new LineService();

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

// 建議加強驗證碼生成的複雜度
const generateVerificationCode = (length: number = 6): string => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

// 建議添加驗證狀態的持久化存儲
const saveVerificationState = async (userId: string, state: VerificationState) => {
  const params = {
    TableName: "AWS_Blog_UserNotificationSettings",
    Key: { userId: { S: userId } },
    UpdateExpression: "SET verificationState = :state",
    ExpressionAttributeValues: {
      ":state": { S: JSON.stringify(state) }
    }
  };
  await dynamoClient.send(new UpdateItemCommand(params));
};

const saveVerificationInfo = async (lineId: string, verificationCode: string) => {
  try {
    const params = {
      TableName: 'AWS_Blog_UserNotificationSettings',
      Item: {
        lineId: { S: lineId },
        verificationCode: { S: verificationCode },
        verificationExpiry: { N: (Date.now() + 5 * 60 * 1000).toString() }, // 5分鐘後過期
        createdAt: { S: new Date().toISOString() }
      }
    };

    await dynamoClient.send(new PutItemCommand(params));
    logger.info('驗證資訊已儲存:', { lineId, verificationCode });
    return true;
  } catch (error) {
    logger.error('儲存驗證資訊失敗:', error);
    throw error;
  }
};