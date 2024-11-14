import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    const { userId, emailNotification, lineNotification, lineUserId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: '缺少必要參數' });
    }

    // 如果要開啟 LINE 通知，檢查是否已驗證
    if (lineNotification) {
      const verificationResult = await checkLineVerificationStatus(userId);
      if (!verificationResult.isVerified) {
        return res.status(400).json({ 
          success: false,
          message: '需要先完成 LINE 驗證才能開啟通知' 
        });
      }
    }

    // 更新 DynamoDB
    const params = {
      TableName: "AWS_Blog_UserNotificationSettings",
      Key: {
        userId: { S: userId }
      },
      UpdateExpression: "SET emailNotification = :email, lineNotification = :line, lineUserId = :lineId, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":email": { BOOL: emailNotification },
        ":line": { BOOL: lineNotification },
        ":lineId": lineUserId ? { S: lineUserId } : { NULL: true },
        ":updatedAt": { S: new Date().toISOString() }
      },
      ReturnValues: "ALL_NEW" as const
    };

    const command = new UpdateItemCommand(params);
    const result = await dynamoClient.send(command);

    logger.info('通知設定已更新:', {
      userId,
      settings: {
        emailNotification,
        lineNotification,
        lineUserId
      },
      result: result.Attributes
    });

    return res.status(200).json({
      success: true,
      message: '設定已更新',
      data: {
        emailNotification: result.Attributes?.emailNotification?.BOOL || false,
        lineNotification: result.Attributes?.lineNotification?.BOOL || false,
        lineUserId: result.Attributes?.lineUserId?.S || null
      }
    });

  } catch (error) {
    logger.error('更新通知設定失敗:', error);
    return res.status(500).json({
      success: false,
      message: '更新設定失敗'
    });
  }
}

// 添加驗證狀態檢查函數
async function checkLineVerificationStatus(userId: string) {
  try {
    const params = {
      TableName: "AWS_Blog_UserNotificationSettings",  
      Key: {
        userId: { S: userId }
      }
    };
    
    const command = new GetItemCommand(params);
    const result = await dynamoClient.send(command);
    
    return {
      isVerified: result.Item?.isVerified?.BOOL || false
    };
  } catch (error) {
    logger.error('檢查 LINE 驗證狀態失敗:', error);
    return { isVerified: false };
  }
} 