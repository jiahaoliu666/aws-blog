import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const { userId, discordNotification } = req.body;

  try {
    // 當 Discord 通知被關閉時，完全刪除該用戶的設定
    if (discordNotification === false) {
      const deleteParams = {
        TableName: "AWS_Blog_UserNotificationSettings",
        Key: {
          userId: { S: userId }
        }
      };

      const command = new DeleteItemCommand(deleteParams);
      await dynamoClient.send(command);

      logger.info('用戶通知設定已完全刪除:', {
        userId,
        action: 'DELETE'
      });

      return res.status(200).json({
        success: true,
        message: '通知設定已刪除',
        reloadRequired: true,
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

    // 其他情況的處理邏輯保持不變...

  } catch (error) {
    logger.error('更新通知設定失敗:', error);
    return res.status(500).json({
      success: false,
      message: '更新失敗，請稍後再試',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
} 