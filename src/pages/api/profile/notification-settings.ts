import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, UpdateItemCommand, ReturnValue } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const { userId, emailNotification, lineNotification } = req.body;

  try {
    const updateExpressions: string[] = [];
    const expressionAttributeValues: Record<string, any> = {};

    if (typeof emailNotification === 'boolean') {
      updateExpressions.push('emailNotification = :email');
      expressionAttributeValues[':email'] = { BOOL: emailNotification };
    }

    if (typeof lineNotification === 'boolean') {
      updateExpressions.push('lineNotification = :line');
      expressionAttributeValues[':line'] = { BOOL: lineNotification };
    }

    if (updateExpressions.length === 0) {
      return res.status(400).json({ message: '沒有要更新的設定' });
    }

    const params = {
      TableName: "AWS_Blog_UserNotificationSettings",
      Key: {
        userId: { S: userId }
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: ReturnValue.ALL_NEW
    };

    const command = new UpdateItemCommand(params);
    const result = await dynamoClient.send(command);

    logger.info('通知設定已更新:', {
      userId,
      emailNotification,
      lineNotification
    });

    return res.status(200).json({
      emailNotification: result.Attributes?.emailNotification?.BOOL || false,
      lineNotification: result.Attributes?.lineNotification?.BOOL || false,
      lineUserId: result.Attributes?.lineUserId?.S || null
    });

  } catch (error) {
    logger.error('更新通知設定失敗:', error);
    return res.status(500).json({
      success: false,
      message: '更新設定失敗'
    });
  }
} 