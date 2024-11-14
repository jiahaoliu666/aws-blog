import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    const { userId } = req.query;

    if (!userId || Array.isArray(userId)) {
      return res.status(400).json({ message: '無效的用戶 ID' });
    }

    const params = {
      TableName: "AWS_Blog_UserNotificationSettings",
      Key: {
        userId: { S: userId }
      }
    };

    const command = new GetItemCommand(params);
    const result = await dynamoClient.send(command);

    logger.info('資料庫回應:', result.Item);

    if (!result.Item) {
      return res.status(200).json({
        emailNotification: false,
        lineNotification: false,
        lineUserId: null,
        lineId: null
      });
    }

    const settings = {
      emailNotification: result.Item.emailNotification?.BOOL || false,
      lineNotification: result.Item.lineNotification?.BOOL || false,
      lineUserId: result.Item.lineUserId?.S || null,
      lineId: result.Item.lineId?.S || null
    };

    logger.info('返回的設定:', settings);

    return res.status(200).json(settings);

  } catch (error) {
    logger.error('獲取通知設定失敗:', error);
    return res.status(500).json({
      success: false,
      message: '獲取設定失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
} 