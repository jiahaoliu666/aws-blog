import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { Redis } from 'ioredis';
import { logger } from '../../../utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL 環境變數未設定');
}

const redis = new Redis(redisUrl);

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

    const CACHE_KEY = `settings:${userId}`;
    const CACHE_DURATION = 300; // 5分鐘

    // 從 DynamoDB 獲取設定
    const params = {
      TableName: 'AWS_Blog_UserNotificationSettings',
      Key: { userId: { S: userId } }
    };
    
    const result = await dynamoClient.send(new GetItemCommand(params));
    const settings = result.Item;

    // 儲存到 Redis
    await redis.setex(CACHE_KEY, CACHE_DURATION, JSON.stringify(settings));

    res.status(200).json({ message: '設定已更新' });
  } catch (error) {
    logger.error('更新通知設定時發生錯誤:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
} 