// services/lineService.ts
import { lineConfig } from '../config/line';
import { generateArticleTemplate } from '../templates/lineTemplates';
import { ArticleData } from '../types/lineTypes';
import { logger } from '../utils/logger';
import axios from 'axios';
import { DynamoDBClient, PutItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

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
    try {
      // 發送歡迎訊息
      const welcomeMessage = {
        type: "text" as const,
        text: `感謝您追蹤 AWS Blog 365！
您的 LINE 帳號已成��驗證 ✅
未來將透�� LINE 為您推送最新 AWS 文章。

💡 小提醒：
• 您可以隨時在個人設定頁面調整通知偏好
• 輸入 "today news" 可查看今日最新文章
• 若有任何問題，歡迎隨時與我們聯繫`
      };

      await sendLineNotification(userId, [welcomeMessage]);
      
      // 更新資料庫狀態
      const params = {
        TableName: 'AWS_Blog_UserNotificationSettings',
        Item: {
          lineUserId: { S: userId },
          lineNotification: { BOOL: true },
          followStatus: { S: 'active' },
          verifiedAt: { S: new Date().toISOString() }
        }
      };

      const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });
      await dynamoClient.send(new PutItemCommand(params));
      
      logger.info('用戶追蹤處理完成', { userId });
      return true;
    } catch (error) {
      logger.error('處理用戶追蹤時發生錯誤:', error);
      return false;
    }
  },
  handleUnfollow: async (userId: string) => {
    // implementation
  }
};

export const checkLineFollowStatus = async (lineId: string): Promise<boolean> => {
  try {
    logger.info(`正在檢查用戶 ${lineId} 的追蹤狀態`);
    
    const response = await fetch(
      `https://api.line.me/v2/bot/profile/${lineId}`,
      {
        headers: {
          Authorization: `Bearer ${lineConfig.channelAccessToken}`,
        },
      }
    );

    logger.info(`LINE API 回應狀態碼: ${response.status}`);

    if (response.ok) {
      const profile = await response.json();
      logger.info(`成功獲取用戶資料:`, profile);
      return true;
    }

    const error = await response.json();
    logger.error('LINE API 錯誤回應:', error);

    if (error.message?.includes('not found')) {
      logger.info(`用戶 ${lineId} 未追蹤官方帳號`);
      return false;
    }

    throw new Error(JSON.stringify(error));
  } catch (error) {
    logger.error('檢查 LINE 追蹤狀態時發生錯誤:', error);
    return false;
  }
};

export async function handleLineWebhook(event: any) {
  const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

  try {
    if (event.type === 'follow') {
      const lineUserId = event.source.userId;
      
      // 更新用戶的通知設定
      const params = {
        TableName: 'AWS_Blog_UserNotificationSettings',
        Item: {
          lineUserId: { S: lineUserId },
          lineNotification: { BOOL: true },
          lastVerified: { S: new Date().toISOString() },
          followStatus: { S: 'active' }
        }
      };

      await dynamoClient.send(new PutItemCommand(params));
      
      logger.info(`用戶 ${lineUserId} 已追蹤官方帳號，通知設定已更新`);
      return true;
    }

    if (event.type === 'unfollow') {
      const lineUserId = event.source.userId;
      
      // 更新用戶的通知設定
      const params = {
        TableName: 'AWS_Blog_UserNotificationSettings',
        Key: {
          lineUserId: { S: lineUserId }
        },
        UpdateExpression: 'SET followStatus = :status, lineNotification = :notification',
        ExpressionAttributeValues: {
          ':status': { S: 'inactive' },
          ':notification': { BOOL: false }
        }
      };

      await dynamoClient.send(new UpdateItemCommand(params));
      
      logger.info(`用戶 ${lineUserId} 已取消追蹤官方帳號，通知設定已更新`);
      return true;
    }

    return false;
  } catch (error) {
    logger.error('處理 LINE Webhook 事件時發生錯誤:', error);
    throw error;
  }
}

export async function sendLineNotification(userId: string, messages: any[]) {
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineConfig.channelAccessToken}`
      },
      body: JSON.stringify({
        to: userId,
        messages: messages
      })
    });

    if (!response.ok) {
      throw new Error(`LINE API responded with status: ${response.status}`);
    }

    return true;
  } catch (error) {
    logger.error('發送 LINE 通知失敗:', error);
    return false;
  }
}