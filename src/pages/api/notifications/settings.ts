import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '../../../utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { userId, lineUserId, lineNotification } = req.body;

  try {
    const updateParams = {
      TableName: 'AWS_Blog_UserNotificationSettings',
      Key: {
        userId: { S: userId }
      },
      UpdateExpression: 'SET lineUserId = :lineUserId, lineNotification = :lineNotification',
      ExpressionAttributeValues: {
        ':lineUserId': { S: lineUserId },
        ':lineNotification': { BOOL: lineNotification }
      }
    };

    await dynamoClient.send(new UpdateItemCommand(updateParams));
    res.status(200).json({ message: '設定已更新' });
  } catch (error) {
    logger.error('更新通知設定時發生錯誤:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
} 