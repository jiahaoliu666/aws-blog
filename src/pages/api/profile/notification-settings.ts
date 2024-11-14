import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, UpdateItemCommand, ReturnValue } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const { userId, emailNotification } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ message: '缺少使用者 ID' });
    }

    if (typeof emailNotification !== 'boolean') {
      return res.status(400).json({ message: '無效的電子郵件通知設定值' });
    }

    const params = {
      TableName: "AWS_Blog_UserNotificationSettings",
      Key: {
        userId: { S: userId }
      },
      UpdateExpression: 'SET emailNotification = :email',
      ExpressionAttributeValues: {
        ':email': { BOOL: emailNotification }
      },
      ReturnValues: ReturnValue.ALL_NEW,
      ConditionExpression: 'attribute_exists(userId) OR attribute_not_exists(userId)'
    };

    const command = new UpdateItemCommand(params);
    const result = await dynamoClient.send(command);

    logger.info('通知設定已更新:', {
      userId,
      emailNotification,
      result: result.Attributes
    });

    const updatedSettings = {
      emailNotification: result.Attributes?.emailNotification?.BOOL || false,
      lineNotification: result.Attributes?.lineNotification?.BOOL || false,
      lineUserId: result.Attributes?.lineUserId?.S || null
    };

    return res.status(200).json(updatedSettings);

  } catch (error) {
    logger.error('更新通知設定失敗:', error);
    return res.status(500).json({
      success: false,
      message: '更新設定失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
} 