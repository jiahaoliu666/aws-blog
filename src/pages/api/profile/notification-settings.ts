import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, UpdateItemCommand, ReturnValue, DeleteItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const { userId, lineNotification, emailNotification, discordNotification, discordId } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ message: '缺少使用者 ID' });
    }

    if (lineNotification && emailNotification) {
      return res.status(400).json({ 
        message: '無法同時啟用 LINE 通知和電子郵件通知' 
      });
    }

    if (discordNotification === false) {
      const params = {
        TableName: "AWS_Blog_UserNotificationSettings",
        Key: {
          userId: { S: userId }
        },
        UpdateExpression: `
          SET discordNotification = :discordNotification,
              lineNotification = :lineNotification,
              emailNotification = :emailNotification,
              updatedAt = :updatedAt
          REMOVE discordId
        `,
        ExpressionAttributeValues: {
          ':discordNotification': { BOOL: false },
          ':lineNotification': { BOOL: lineNotification || false },
          ':emailNotification': { BOOL: emailNotification || false },
          ':updatedAt': { S: new Date().toISOString() }
        },
        ReturnValues: ReturnValue.ALL_NEW
      };

      const command = new UpdateItemCommand(params);
      const result = await dynamoClient.send(command);

      logger.info('Discord 通知設定已更新:', {
        userId,
        discordNotification: false,
        result: result.Attributes
      });

      return res.status(200).json({
        success: true,
        message: '通知設定已更新',
        reloadRequired: true,
        settings: {
          discordNotification: false,
          discordId: null,
          lineNotification: lineNotification || false,
          emailNotification: emailNotification || false,
          lineId: result.Attributes?.lineId?.S || null
        }
      });
    } else {
      // 處理一般的設定更新(當 lineNotification 不是 false 時)
      const params = {
        TableName: "AWS_Blog_UserNotificationSettings",
        Key: {
          userId: { S: userId }
        },
        UpdateExpression: `
          SET lineNotification = :lineNotification,
              emailNotification = :emailNotification,
              discordNotification = :discordNotification,
              discordId = :discordId,
              lineId = if_not_exists(lineId, :defaultLineId),
              updatedAt = :updatedAt
        `,
        ExpressionAttributeValues: {
          ':lineNotification': { BOOL: lineNotification || false },
          ':emailNotification': { BOOL: emailNotification || false },
          ':discordNotification': { BOOL: discordNotification || false },
          ':discordId': discordId ? { S: discordId } : { NULL: true },
          ':defaultLineId': { NULL: true },
          ':updatedAt': { S: new Date().toISOString() }
        },
        ReturnValues: ReturnValue.ALL_NEW
      };

      const command = new UpdateItemCommand(params);
      const result = await dynamoClient.send(command);

      logger.info('通知設定已更新:', {
        userId,
        lineNotification,
        emailNotification,
        result: result.Attributes
      });

      return res.status(200).json({
        success: true,
        message: '通知設定已更新',
        reloadRequired: true,
        settings: {
          lineNotification: lineNotification || false,
          emailNotification: emailNotification || false,
          discordNotification: discordNotification || false,
          discordId: result.Attributes?.discordId?.S || null,
          lineId: result.Attributes?.lineId?.S || null
        }
      });
    }

  } catch (error) {
    logger.error('更新通知設定失敗:', error);
    return res.status(500).json({
      success: false,
      message: '更新失敗，請稍後再試',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
} 