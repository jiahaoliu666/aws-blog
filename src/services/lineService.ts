// services/lineService.ts
import { lineConfig } from '../config/line';
import { createWelcomeTemplate } from '../templates/lineTemplates';
import { DynamoDBClient, UpdateItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '../utils/logger';
import NodeCache from 'node-cache';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });
const lineStatusCache = new NodeCache({ stdTTL: 300 }); // 5分鐘快取

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

export const lineService = {
  // 處理用戶追蹤事件
  handleFollow: async (userId: string, lineUserId: string) => {
    try {
      // 1. 更新資料庫中的訂閱狀態
      const updateParams = {
        TableName: 'AWS_Blog_UserNotificationSettings',
        Key: {
          userId: { S: userId }
        },
        UpdateExpression: 'SET lineNotification = :true, lineUserId = :lineUserId, isSubscribed = :true',
        ExpressionAttributeValues: {
          ':true': { BOOL: true },
          ':lineUserId': { S: lineUserId },
          ':isSubscribed': { BOOL: true }
        }
      };

      await dynamoClient.send(new UpdateItemCommand(updateParams));

      // 2. 發送歡迎訊息
      await sendWelcomeMessage(lineUserId);

      return true;
    } catch (error) {
      logger.error('處理追蹤事件時發生錯誤:', error);
      return false;
    }
  },

  // 處理用戶取消追蹤事件
  handleUnfollow: async (userId: string) => {
    try {
      const updateParams = {
        TableName: 'AWS_Blog_UserNotificationSettings',
        Key: {
          userId: { S: userId }
        },
        UpdateExpression: 'SET lineNotification = :false, isSubscribed = :false',
        ExpressionAttributeValues: {
          ':false': { BOOL: false },
          ':isSubscribed': { BOOL: false }
        }
      };

      await dynamoClient.send(new UpdateItemCommand(updateParams));
      return true;
    } catch (error) {
      logger.error('處理取消追蹤事件時發生錯誤:', error);
      return false;
    }
  },

  // 檢查追蹤狀態
  checkFollowStatus: async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/line/check-follow-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('檢查追蹤狀態失敗');
      }

      const data = await response.json();
      return data.isFollowing;
    } catch (error) {
      console.error('檢查追蹤狀態時發生錯誤:', error);
      throw error;
    }
  },

  // 產生驗證碼
  generateVerificationCode: async (userId: string) => {
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
      const updateParams = {
        TableName: 'AWS_Blog_UserNotificationSettings',
        Key: {
          userId: { S: userId }
        },
        UpdateExpression: 'SET verificationCode = :code, verificationExpiry = :expiry',
        ExpressionAttributeValues: {
          ':code': { S: verificationCode },
          ':expiry': { N: String(Date.now() + 1000 * 60 * 10) } // 10分鐘有效期
        }
      };

      await dynamoClient.send(new UpdateItemCommand(updateParams));
      return verificationCode;
    } catch (error) {
      logger.error('產生驗證碼時發生錯誤:', error);
      throw error;
    }
  },

  // 處理驗證訊息
  handleVerification: async (message: string, lineUserId: string) => {
    if (!message.startsWith('verify:')) return;
    
    const code = message.split(':')[1];
    try {
      const params = {
        TableName: 'AWS_Blog_UserNotificationSettings',
        FilterExpression: 'verificationCode = :code AND verificationExpiry > :now',
        ExpressionAttributeValues: {
          ':code': { S: code },
          ':now': { N: String(Date.now()) }
        }
      };

      const result = await dynamoClient.send(new ScanCommand(params));
      if (result.Items && result.Items.length > 0) {
        const userId = result.Items[0].userId.S;
        if (!userId) {
            return false;
        }
        await lineService.handleFollow(userId, lineUserId);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('驗證碼驗證失敗:', error);
      return false;
    }
  },

  verifyLineUser: async (userId: string, lineId: string) => {
    try {
      // 1. 檢查是否已追蹤官方帳號
      const isFollowing = await checkLineFollowStatus(lineId);
      if (!isFollowing) {
        return {
          success: false,
          message: '請先追蹤官方帳號'
        };
      }

      // 2. 產生驗證碼
      const verificationCode = await lineService.generateVerificationCode(userId);

      // 3. 發送驗證碼訊息給用戶
      await sendWelcomeMessage(lineId);
      await lineService.sendVerificationMessage(lineId, verificationCode);

      return {
        success: true,
        message: '已發送驗證碼，請在 LINE 中查收'
      };
    } catch (error) {
      logger.error('LINE 驗證失敗:', error);
      return {
        success: false,
        message: '驗證過程發生錯誤'
      };
    }
  },

  // 新增發送驗證碼訊息的函數
  sendVerificationMessage: async (lineId: string, code: string) => {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineConfig.channelAccessToken}`
      },
      body: JSON.stringify({
        to: lineId,
        messages: [{
          type: 'text',
          text: `您的驗證碼是：${code}\n請在網頁上輸入此驗證碼完成驗證。\n驗證碼有效期為10分鐘。`
        }]
      })
    });

    if (!response.ok) {
      throw new Error('發送驗證碼訊息失敗');
    }
  }
};