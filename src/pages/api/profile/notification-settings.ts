import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, UpdateItemCommand, ReturnValue, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const { userId, lineNotification } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ message: '缺少使用者 ID' });
    }

    if (lineNotification === false) {
      const params = {
        TableName: "AWS_Blog_UserNotificationSettings",
        Key: {
          userId: { S: userId }
        },
        UpdateExpression: `
          SET lineNotification = :lineNotification,
              updatedAt = :updatedAt
          REMOVE lineId,
                 lineUserId,
                 verificationCode,
                 verificationExpiry,
                 verificationStep,
                 verificationStatus,
                 isVerified,
                 lastVerified,
                 lastCancelled,
                 verificationCount,
                 cancellationCount
        `,
        ExpressionAttributeValues: {
          ':lineNotification': { BOOL: false },
          ':updatedAt': { S: new Date().toISOString() }
        },
        ReturnValues: ReturnValue.ALL_NEW
      };

      try {
        const command = new UpdateItemCommand(params);
        const result = await dynamoClient.send(command);

        await dynamoClient.send(new DeleteItemCommand({
          TableName: "AWS_Blog_LineVerifications",
          Key: {
            userId: { S: userId }
          }
        }));

        logger.info('LINE 通知已關閉，驗證資料已清除:', {
          userId,
          result: result.Attributes
        });

        return res.status(200).json({
          success: true,
          message: 'LINE 通知已關閉，所有驗證資料已清除',
          settings: {
            lineNotification: false,
            lineId: null
          }
        });

      } catch (error) {
        logger.error('更新 LINE 通知設定失敗:', error);
        throw new Error('更新 LINE 通知設定失敗');
      }
    }

  } catch (error) {
    logger.error('更新通知設定失敗:', error);
    return res.status(500).json({
      success: false,
      message: '重置失敗，請稍後再試',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
} 