import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, DeleteItemCommand, PutItemCommand, GetItemCommand, AttributeValue } from '@aws-sdk/client-dynamodb';
import { logger } from '@/utils/logger';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

interface NotificationSettings {
  userId: { S: string };
  emailNotification: { BOOL: boolean };
  email?: { S: string };
  discordNotification: { BOOL: boolean };
  discordId?: { S: string };
  lineNotification: { BOOL: boolean };
  lineId?: { S: string };
  lineUserId?: { S: string };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const { userId, emailNotification, email, discordNotification, lineNotification, lineId, lineUserId, discordId } = req.body;

  try {
    // 檢查是否已存在設定
    const getParams = {
      TableName: "AWS_Blog_UserNotificationSettings",
      Key: {
        userId: { S: userId }
      }
    };

    const existingSettings = await dynamoClient.send(new GetItemCommand(getParams));

    // 構建新的設定
    const newSettings: Record<string, AttributeValue> = {
      userId: { S: userId },
      emailNotification: { BOOL: !!emailNotification },
      discordNotification: { BOOL: !!discordNotification },
      lineNotification: { BOOL: !!lineNotification }
    };

    // 有條件地添加可選欄位
    if (email) newSettings.email = { S: email };
    if (discordId) newSettings.discordId = { S: discordId };
    if (lineId) newSettings.lineId = { S: lineId };
    if (lineUserId) newSettings.lineUserId = { S: lineUserId };

    // 更新設定
    const putParams = {
      TableName: "AWS_Blog_UserNotificationSettings",
      Item: newSettings
    };

    await dynamoClient.send(new PutItemCommand(putParams));

    logger.info('用戶通知設定已更新:', {
      userId,
      emailNotification,
      discordNotification,
      lineNotification,
      action: 'UPDATE'
    });

    return res.status(200).json({
      success: true,
      message: '通知設定已更新',
      settings: {
        emailNotification: !!emailNotification,
        email,
        discordNotification: !!discordNotification,
        discordId,
        lineNotification: !!lineNotification,
        lineId,
        lineUserId
      }
    });

  } catch (error) {
    logger.error('更新通知設定失敗:', error);
    return res.status(500).json({
      success: false,
      message: '更新失敗，請稍後再試',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
} 