import { NextApiRequest, NextApiResponse } from 'next';
import { lineConfig } from '@/config/line';
import { logger } from '@/utils/logger';
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { checkLineFollowStatus } from '@/services/lineService';
import { lineService } from '@/services/lineService';

const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允許' });
  }

  const { lineId, userId } = req.body;

  try {
    // 1. 檢查追蹤狀態
    const isFollowing = await checkLineFollowStatus(lineId);
    
    if (isFollowing) {
      // 2. 如果已追蹤，進行驗證
      const verificationResult = await lineService.verifyLineUser(userId, lineId);
      
      if (verificationResult.success) {
        return res.status(200).json({
          success: true,
          isFollowing: true,
          message: verificationResult.message
        });
      }
    }

    return res.status(200).json({
      success: false,
      isFollowing: false,
      message: '請先追蹤官方帳號'
    });

  } catch (error) {
    logger.error('驗證過程發生錯誤:', error);
    return res.status(500).json({
      success: false,
      error: '驗證過程發生錯誤'
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