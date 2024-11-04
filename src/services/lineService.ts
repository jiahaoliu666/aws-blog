// services/lineService.ts
import { lineConfig } from '../config/line';
import { createWelcomeTemplate } from '../templates/lineTemplates';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '../utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

// 檢查 LINE 追蹤狀態
export const checkLineFollowStatus = async (sub: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/line/check-follow-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: sub }),
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
  }
};