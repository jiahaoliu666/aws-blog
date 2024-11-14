import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
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