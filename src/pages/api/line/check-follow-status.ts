import type { NextApiRequest, NextApiResponse } from 'next';
import { lineConfig } from '@/config/line';
import { logger } from '@/utils/logger';
import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { ddbClient } from '../../../utils/dynamodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允許' });
  }

  const { lineId, userId } = req.body;

  if (!lineId || !userId) {
    return res.status(400).json({ error: '缺少必要參數' });
  }

  try {
    logger.info('檢查 LINE 追蹤狀態:', { lineId, userId });

    // 呼叫 LINE API 檢查好友關係
    const response = await fetch(`https://api.line.me/v2/bot/profile/${lineId}`, {
      headers: {
        Authorization: `Bearer ${lineConfig.channelAccessToken}`,
      },
    });

    logger.info('LINE API 回應:', { status: response.status });

    const isFollowing = response.ok;

    // 如果是好友關係，更新資料庫
    if (isFollowing) {
      // 更新用戶的 LINE 設定到資料庫
      const updateParams = {
        TableName: 'AWS_Blog_UserNotificationSettings',
        Key: {
          userId: { S: userId }
        },
        UpdateExpression: 'SET lineUserId = :lineId, lineNotification = :enabled',
        ExpressionAttributeValues: {
          ':lineId': { S: lineId },
          ':enabled': { BOOL: true }
        }
      };

      await ddbClient.send(new UpdateItemCommand(updateParams));
      logger.info('已更新用戶的 LINE 設定');
    }

    return res.status(200).json({ 
      isFollowing,
      message: isFollowing ? '驗證成功' : '請先加入官方帳號為好友'
    });

  } catch (error) {
    logger.error('檢查 LINE 追蹤狀態時發生錯誤:', error);
    return res.status(500).json({ error: '驗證過程發生錯誤' });
  }
}

// 設定請求大小限制
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
}; 