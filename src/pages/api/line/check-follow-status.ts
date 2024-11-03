import { NextApiRequest, NextApiResponse } from 'next';
import { lineConfig } from '@/config/line';
import { logger } from '@/utils/logger';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
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
    const { lineId } = req.body;
    
    if (!lineId) {
      logger.warn('請求中缺少 LINE ID');
      return res.status(400).json({ error: '缺少 LINE ID' });
    }

    // 使用 lineService 的檢查函數
    const isFollowing = await checkLineFollowStatus(lineId);
    
    return res.status(200).json({ 
      isFollowing,
      message: isFollowing ? '用戶已追蹤' : '用戶未追蹤'
    });

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