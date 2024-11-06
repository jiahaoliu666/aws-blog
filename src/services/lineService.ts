// services/lineService.ts
import { lineConfig } from '../config/line';
import { createWelcomeTemplate } from '../templates/lineTemplates';
import { DynamoDBClient, UpdateItemCommand, ScanCommand, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '../utils/logger';
import NodeCache from 'node-cache';
import { LineVerification, LineFollowStatus } from "../types/lineTypes";

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
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${lineConfig.channelAccessToken}`
    },
    body: JSON.stringify({
      to: lineId,
      messages: [message]
    })
  });

  if (!response.ok) {
    throw new Error('發送 LINE 訊息失敗');
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

export class LineService {
  // 生成驗證碼
  async generateVerificationCode(userId: string): Promise<string> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // 存儲到 DynamoDB
    const params = {
      TableName: "AWS_Blog_LineVerification",
      Item: {
        userId: { S: userId },
        code: { S: code },
        expireAt: { N: (Date.now() + 600000).toString() } // 10分鐘過期
      }
    };

    await dynamoClient.send(new PutItemCommand(params));
    return code;
  }

  // 驗證碼確認
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const params = {
      TableName: "AWS_Blog_LineVerification",
      KeyConditionExpression: "userId = :userId",
      FilterExpression: "code = :code",
      ExpressionAttributeValues: {
        ":userId": { S: userId },
        ":code": { S: code }
      }
    };

    const result = await dynamoClient.send(new QueryCommand(params));
    
    if (!result.Items?.[0]) return false;
    
    const item = result.Items[0];
    const expireAt = parseInt(item.expireAt.N || "0");
    
    return Date.now() < expireAt;
  }

  // 檢查追蹤狀態
  async checkFollowStatus(lineId: string): Promise<LineFollowStatus> {
    try {
      const response = await fetch(
        `https://api.line.me/v2/bot/profile/${lineId}`,
        {
          headers: {
            Authorization: `Bearer ${lineConfig.channelAccessToken}`
          }
        }
      );

      if (response.ok) {
        return {
          isFollowing: true,
          message: "用戶已追蹤官方帳號"
        };
      }

      return {
        isFollowing: false,
        message: "用戶尚未追蹤官方帳號"
      };
    } catch (error) {
      console.error("檢查追蹤狀態時發生錯誤:", error);
      throw error;
    }
  }

  // 更新用戶 LINE 設定
  async updateLineSettings(userId: string, lineId: string, isVerified: boolean) {
    const params = {
      TableName: "AWS_Blog_UserNotificationSettings",
      Item: {
        userId: { S: userId },
        lineId: { S: lineId },
        isVerified: { BOOL: isVerified },
        updatedAt: { S: new Date().toISOString() }
      }
    };

    await dynamoClient.send(new PutItemCommand(params));
  }

  // 處理用戶追蹤
  async handleFollow(lineId: string) {
    try {
      await updateUserLineStatus(lineId, true);
      // 發送歡迎訊息
      const welcomeMessage = createWelcomeTemplate('新訂閱者');
      await sendLineMessage(lineId, welcomeMessage);
    } catch (error) {
      logger.error('處理追蹤事件時發生錯誤:', error);
    }
  }

  // 處理用戶取消追蹤
  async handleUnfollow(userId: string) {
    try {
      // 更新資料庫中的追蹤狀態
      const params = {
        TableName: "AWS_Blog_UserNotificationSettings",
        Key: { userId: { S: userId } },
        UpdateExpression: "SET lineNotification = :false",
        ExpressionAttributeValues: {
          ":false": { BOOL: false }
        }
      };
      
      await dynamoClient.send(new UpdateItemCommand(params));
      
    } catch (error) {
      logger.error('處理用戶取消追蹤事件時發生錯誤:', error);
    }
  }

  async handleVerification(verificationText: string, userId: string): Promise<void> {
    // 在這裡實現驗證邏輯
  }

  async verifyLineId(lineId: string) {
    // 檢查追蹤狀態的功能可以正常運作
    // 因為這是使用 LINE Messaging API 而不是 webhook
    return this.checkFollowStatus(lineId);
  }

  async handleWebhook(event: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log('開發環境：模擬處理 webhook 事件', event);
      return;
    }
    // 生產環境的 webhook 處理邏輯
  }

  // 新增文章通知函數
  async sendArticleNotification(articleData: any) {
    try {
      const params = {
        TableName: "AWS_Blog_UserNotificationSettings",
        FilterExpression: "isFollowing = :true",
        ExpressionAttributeValues: {
          ":true": { BOOL: true }
        }
      };

      const result = await dynamoClient.send(new ScanCommand(params));
      
      if (!result.Items?.length) return;

      for (const user of result.Items) {
        const lineId = user.lineId.S;
        if (lineId) {
          await sendLineMessage(lineId, {
            type: "text",
            text: `新文章通知：${articleData.title}\n${articleData.url}`
          });
        }
      }
    } catch (error) {
      logger.error('發送文章通知時發生錯誤:', error);
      throw error;
    }
  }

  async saveVerificationInfo(verificationData: LineVerification): Promise<void> {
    const params = {
      TableName: "AWS_Blog_UserNotificationSettings",
      Key: {
        userId: { S: verificationData.userId }
      },
      UpdateExpression: "SET verificationCode = :code, verificationExpiry = :expiry, lineId = :lineId, updatedAt = :updatedAt, createdAt = :createdAt",
      ExpressionAttributeValues: {
        ":code": { S: verificationData.code },
        ":expiry": { N: (Date.now() + 600000).toString() },
        ":lineId": { S: verificationData.lineId },
        ":updatedAt": { S: new Date().toISOString() },
        ":createdAt": { S: verificationData.createdAt }
      }
    };

    await dynamoClient.send(new UpdateItemCommand(params));
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
    console.error('發送驗證請求時發生錯誤:', error);
    throw error;
  }
}