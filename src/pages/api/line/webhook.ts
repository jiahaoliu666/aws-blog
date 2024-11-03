// pages/api/line/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { WebhookEvent } from '@line/bot-sdk';
import { verifyLineSignature } from '@/utils/lineUtils';
import { logger } from '@/utils/logger';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允許' });
  }

  try {
    // 驗證 LINE 簽章
    if (!verifyLineSignature(req)) {
      return res.status(401).json({ error: '無效的簽章' });
    }

    const events: WebhookEvent[] = req.body.events;
    
    await Promise.all(events.map(async (event) => {
      const userId = event.source.userId;
      if (!userId) {
        logger.error('找不到使用者 ID');
        return;
      }

      switch (event.type) {
        case 'follow':
          // 處理追蹤事件
          await updateFollowStatus(userId, true);
          break;
          
        case 'unfollow':
          // 處理取消追蹤事件
          await updateFollowStatus(userId, false);
          break;
      }
    }));

    res.status(200).end();
  } catch (error) {
    logger.error('處理 Webhook 事件失敗:', error);
    res.status(500).json({ error: '內部伺服器錯誤' });
  }
}

async function updateFollowStatus(userId: string, isFollowing: boolean) {
  const params = {
    TableName: 'AWS_Blog_UserNotificationSettings',
    Item: {
      lineUserId: { S: userId },
      lineNotification: { BOOL: isFollowing },
      followStatus: { S: isFollowing ? 'active' : 'inactive' },
      updatedAt: { S: new Date().toISOString() }
    }
  };

  try {
    await dynamoClient.send(new PutItemCommand(params));
    logger.info(`用戶 ${userId} ${isFollowing ? '追蹤' : '取消追蹤'}狀態已更新`);
  } catch (error) {
    logger.error('更新追蹤狀態失敗:', error);
    throw error;
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