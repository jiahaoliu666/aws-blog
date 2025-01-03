import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, DeleteItemCommand, PutItemCommand, GetItemCommand, AttributeValue } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

interface NotificationSettings {
  userId: { S: string };
  emailNotification: { BOOL: boolean };
  email?: { S: string };
  discordNotification?: { BOOL: boolean };
  discordId?: { S: string };
  lineNotification?: { BOOL: boolean };
  lineId?: { S: string };
  lineUserId?: { S: string };
  updatedAt: { S: string };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const { userId, emailNotification, email, discordNotification, lineNotification, lineId, lineUserId, discordId } = req.body;

  try {
    // 檢查是否已存在設定
    const getParams = {
      TableName: "AWS_Blog_UserNotificationSettings",
      Key: {
        userId: { S: userId }
      }
    };

    const existingSettings = await dynamoClient.send(new GetItemCommand(getParams));

    // 獲取當前時間的 ISO 字符串
    const timestamp = new Date().toISOString();

    // 如果任何一個通知設定被關閉，則刪除相關記錄
    if (existingSettings.Item && 
        (!emailNotification && !discordNotification && !lineNotification)) {
      
      // 1. 刪除 AWS_Blog_UserNotificationSettings 表的記錄
      const deleteNotificationParams = {
        TableName: "AWS_Blog_UserNotificationSettings",
        Key: {
          userId: { S: userId }
        }
      };

      // 2. 刪除 AWS_Blog_LineVerifications 表的記錄
      const deleteVerificationParams = {
        TableName: "AWS_Blog_LineVerifications",
        Key: {
          userId: { S: userId }
        }
      };

      // 使用 Promise.all 同時執行兩個刪除操作
      await Promise.all([
        dynamoClient.send(new DeleteItemCommand(deleteNotificationParams)),
        dynamoClient.send(new DeleteItemCommand(deleteVerificationParams))
      ]);

      logger.info('用戶通知設定和驗證記錄已刪除:', {
        userId,
        action: 'DELETE',
        deletedAt: timestamp,
        tables: ['AWS_Blog_UserNotificationSettings', 'AWS_Blog_LineVerifications']
      });

      return res.status(200).json({
        success: true,
        message: '通知設定已刪除',
        settings: {
          emailNotification: false,
          email: undefined,
          discordNotification: false,
          discordId: undefined,
          lineNotification: false,
          lineId: undefined,
          lineUserId: undefined,
          updatedAt: timestamp
        }
      });
    }

    // 構建新的設定
    let newSettings: Record<string, AttributeValue> = {
      userId: { S: userId },
      updatedAt: { S: timestamp }
    };

    // 根據不同的通知類型設置對應的設定
    if (emailNotification) {
      // 如果開啟電子郵件通知，只保存電子郵件相關設定
      newSettings = {
        userId: { S: userId },
        email: { S: email },
        emailNotification: { BOOL: true },
        updatedAt: { S: timestamp }
      };
    } else if (discordNotification) {
      // 如果開啟 Discord 通知
      newSettings = {
        userId: { S: userId },
        discordId: { S: discordId },
        discordNotification: { BOOL: true },
        updatedAt: { S: timestamp }
      };
    } else if (lineNotification) {
      // 如果開啟 LINE 通知
      newSettings = {
        userId: { S: userId },
        lineId: { S: lineId },
        lineUserId: { S: lineUserId },
        lineNotification: { BOOL: true },
        updatedAt: { S: timestamp }
      };
    }

    // 更新設定
    const putParams = {
      TableName: "AWS_Blog_UserNotificationSettings",
      Item: newSettings
    };

    await dynamoClient.send(new PutItemCommand(putParams));

    logger.info('用戶通知設定已更新:', {
      userId,
      emailNotification,
      action: 'UPDATE',
      updatedAt: timestamp
    });

    return res.status(200).json({
      success: true,
      message: '通知設定已更新',
      settings: {
        emailNotification: !!emailNotification,
        email: emailNotification ? email : undefined,
        discordNotification: !!discordNotification,
        discordId: discordNotification ? discordId : undefined,
        lineNotification: !!lineNotification,
        lineId: lineNotification ? lineId : undefined,
        lineUserId: lineNotification ? lineUserId : undefined,
        updatedAt: timestamp
      }
    });

  } catch (error) {
    logger.error('更新通知設定失敗:', {
      error: error instanceof Error ? error.message : '未知錯誤',
      userId,
      tables: ['AWS_Blog_UserNotificationSettings', 'AWS_Blog_LineVerifications']
    });
    
    return res.status(500).json({
      success: false,
      message: '更新失敗，請稍後再試',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
} 