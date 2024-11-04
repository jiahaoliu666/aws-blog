import { NextApiRequest, NextApiResponse } from 'next';
import { lineConfig } from '@/config/line';
import { logger } from '@/utils/logger';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { checkLineFollowStatus } from '@/services/lineService';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 檢查必要的設定
  if (!lineConfig.channelAccessToken) {
    logger.error('缺少 LINE Channel Access Token');
    return res.status(500).json({ error: '伺服器設定錯誤' });
  }

  if (req.method !== 'POST') {
    logger.warn('收到非 POST 請求');
    return res.status(405).json({ error: '方法不允許' });
  }

  try {
    const { lineId, userId } = req.body;
    
    if (!lineId || !userId) {
      logger.warn('請求缺少必要參數');
      return res.status(400).json({ 
        error: '缺少必要參數',
        details: !lineId ? '缺少 LINE ID' : '缺少 User ID' 
      });
    }

    // 檢查追蹤狀態
    const isFollowing = await checkLineFollowStatus(lineId);
    
    if (isFollowing) {
      // 如果用戶已追蹤，更新資料庫
      try {
        const updateParams = {
          TableName: 'AWS_Blog_UserNotificationSettings',
          Key: {
            userId: { S: userId }
          },
          UpdateExpression: 'SET lineUserId = :lineId, lineNotification = :true, isSubscribed = :true, updatedAt = :timestamp',
          ExpressionAttributeValues: {
            ':lineId': { S: lineId },
            ':true': { BOOL: true },
            ':timestamp': { S: new Date().toISOString() }
          },
          ReturnValues: 'ALL_NEW' as const
        };

        await dynamoClient.send(new UpdateItemCommand(updateParams));
        
        logger.info('用戶追蹤狀態已更新', { userId, lineId });
      } catch (dbError) {
        logger.error('更新資料庫時發生錯誤', {
          error: dbError instanceof Error ? dbError.message : String(dbError),
          userId,
          lineId
        });
        // 即使資料庫更新失敗，仍然回傳追蹤狀態
      }
    }

    // 檢查資料庫中的設定
    try {
      const getParams = {
        TableName: 'AWS_Blog_UserNotificationSettings',
        Key: {
          userId: { S: userId }
        }
      };

      const dbResponse = await dynamoClient.send(new GetItemCommand(getParams));
      const currentSettings = dbResponse.Item;

      return res.status(200).json({ 
        isFollowing,
        message: isFollowing ? '用戶已追蹤' : '用戶未追蹤',
        settings: {
          lineNotification: currentSettings?.lineNotification?.BOOL || false,
          isSubscribed: currentSettings?.isSubscribed?.BOOL || false,
          lineUserId: currentSettings?.lineUserId?.S || ''
        }
      });

    } catch (dbError) {
      logger.error('讀取資料庫設定時發生錯誤', {
        error: dbError instanceof Error ? dbError.message : String(dbError),
        userId
      });
      
      return res.status(200).json({ 
        isFollowing,
        message: isFollowing ? '用戶已追蹤' : '用戶未追蹤',
        settings: {
          lineNotification: false,
          isSubscribed: false,
          lineUserId: ''
        }
      });
    }

  } catch (error) {
    logger.error('檢查追蹤狀態時發生錯誤', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return res.status(500).json({ 
      error: '檢查追蹤狀態時發生錯誤',
      details: error instanceof Error ? error.message : String(error)
    });
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