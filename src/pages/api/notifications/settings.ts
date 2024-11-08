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

  const { userId, lineId, lineNotification } = req.body;

  try {
    const updateParams = {
      TableName: 'AWS_Blog_UserNotificationSettings',
      Key: {
        userId: { S: userId }
      },
      UpdateExpression: 'SET lineId = :lineId, lineNotification = :lineNotification, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':lineId': { S: lineId || '' },
        ':lineNotification': { BOOL: lineNotification },
        ':updatedAt': { S: new Date().toISOString() }
      }
    };

    await dynamoClient.send(new UpdateItemCommand(updateParams));

    // 更新 Redis 快取
    const CACHE_KEY = `settings:${userId}`;
    const CACHE_DURATION = 300; // 5分鐘
    await redis.setex(CACHE_KEY, CACHE_DURATION, JSON.stringify({
      lineId,
      lineNotification,
      updatedAt: new Date().toISOString()
    }));

    res.status(200).json({ message: '設定已更新' });
  } catch (error) {
    logger.error('更新通知設定失敗:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
} 