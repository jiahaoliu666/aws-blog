import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: '方法不允許',
      allowedMethods: ['GET', 'POST']
    });
  }

  try {
    const { userId } = req.query;

    if (!userId || Array.isArray(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: '無效的用戶 ID' 
      });
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
        success: true,
        settings: {
          emailNotification: false,
          lineNotification: false,
          discordNotification: false,
          lineUserId: null,
          lineId: null,
          discordId: null
        }
      });
    }

    const formatSettings = (dbItem: any) => {
      return {
        emailNotification: dbItem.emailNotification?.BOOL || false,
        lineNotification: dbItem.lineNotification?.BOOL || false,
        discordNotification: dbItem.discordNotification?.BOOL || false,
        lineId: dbItem.lineId?.S || null,
        lineUserId: dbItem.lineUserId?.S || null,
        discordId: dbItem.discordId?.S || null,
      };
    };

    const settings = formatSettings(result.Item);
    logger.info('返回的設定:', settings);

    return res.status(200).json({
      success: true,
      settings
    });

  } catch (error) {
    logger.error('獲取通知設定失敗:', error);
    return res.status(500).json({
      success: false,
      message: '獲取設定失敗',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
} 