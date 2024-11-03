import { NextApiRequest, NextApiResponse } from 'next';
import { checkLineFollowStatus } from '@/services/lineService';
import { logger } from '@/utils/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允許' });
  }

  try {
    const { lineId } = req.body;
    
    if (!lineId) {
      return res.status(400).json({ error: '缺少 LINE ID' });
    }

    logger.info(`接收到檢查追蹤狀態請求: ${lineId}`);
    
    const isFollowing = await checkLineFollowStatus(lineId);
    
    logger.info(`用戶 ${lineId} 追蹤狀態: ${isFollowing}`);
    
    res.status(200).json({ isFollowing });
  } catch (error) {
    logger.error('LINE API 錯誤:', error);
    res.status(500).json({ 
      error: '檢查追蹤狀態時發生錯誤',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 