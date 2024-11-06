// services/lineService.ts
import { lineConfig } from '../config/line';
import { createWelcomeTemplate } from '../templates/lineTemplates';
import { DynamoDBClient, UpdateItemCommand, ScanCommand, PutItemCommand, QueryCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '../utils/logger';
import NodeCache from 'node-cache';
import { LineVerification, LineFollowStatus } from "../types/lineTypes";
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

// 新增 sendLineMessage 函數
const sendLineMessage = async (lineId: string, message: any) => {
  try {
    validateLineMessagingConfig(); // 先驗證配置
    
    // 加強 lineId 驗證
    if (!lineId || typeof lineId !== 'string' || lineId.trim().length === 0) {
      throw new Error('無效的 LINE ID');
    }

    // 確保 lineId 符合 LINE 的格式要求（通常以 "U" 開頭）
    if (!lineId.match(/^U[a-zA-Z0-9]{32}$/)) {
      throw new Error('LINE ID 格式不正確');
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineConfig.channelAccessToken}`
      },
      body: JSON.stringify({
        to: lineId.trim(),
        messages: Array.isArray(message) ? message : [message]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('LINE API 錯誤回應:', errorData);
      throw new Error(`發送 LINE 訊息失敗: ${errorData.message}`);
    }
  } catch (error) {
    logger.error('發送 LINE 訊息時發生錯誤:', error);
    throw error;
  }
};

// 新增 sendWelcomeMessage 函數
const sendWelcomeMessage = async (lineUserId: string) => {
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${lineConfig.channelAccessToken}`
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [createWelcomeTemplate('新訂閱者')]
    })
  });

  if (!response.ok) {
    throw new Error('發送歡迎訊息失敗');
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
  async checkFollowStatus(lineId: string) {
    const response = await fetch(`${lineConfig.apiUrl}/profile/${lineId}`, {
      headers: {
        Authorization: `Bearer ${lineConfig.channelAccessToken}`
      }
    });
    return { isFollowing: response.ok };
  },

  async sendVerificationMessage(lineId: string, code: string) {
    const message = {
      type: 'flex',
      altText: '驗證碼',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: `您的驗證碼是：${code}`,
              weight: 'bold'
            },
            {
              type: 'text',
              text: '請在 5 分鐘內完成驗證',
              size: 'sm',
              color: '#888888'
            }
          ]
        }
      }
    };

    await this.sendMessage(lineId, message);
  },

  async updateUserLineSettings({ userId, lineId, isVerified }: {
    userId: string;
    lineId: string;
    isVerified: boolean;
  }) {
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
  },

  async sendMessage(lineId: string, message: any) {
    return sendLineMessage(lineId, message);
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
      console.error('驗證碼確認失敗:', error);
      return false;
    }
  },
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
    console.error('發送驗證求時發生錯誤:', error);
    throw error;
  }
}