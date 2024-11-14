import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { userId, type, enabled } = req.body;

      const params = {
        TableName: "AWS_Blog_UserNotificationSettings",
        Key: {
          userId: { S: userId }
        },
        UpdateExpression: `SET notificationPreferences.#type = :enabled`,
        ExpressionAttributeNames: {
          '#type': type
        },
        ExpressionAttributeValues: {
          ':enabled': { BOOL: enabled }
        }
      };

      await dynamoClient.send(new UpdateItemCommand(params));
      
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('更新通知設定失敗:', error);
      res.status(500).json({ error: '更新設定失敗' });
    }
  } else if (req.method === 'GET') {
    // 處理獲取設定的邏輯
    // ...
  } else {
    res.status(405).json({ error: '方法不允許' });
  }
} 