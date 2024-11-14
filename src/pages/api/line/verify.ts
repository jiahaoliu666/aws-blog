import { NextApiRequest, NextApiResponse } from 'next';
import { withRetry } from '@/utils/retryUtils';
import { lineService } from '@/services/lineService';
import { logger } from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    const { userId, code } = req.body;

    const result = await withRetry(
      async () => await lineService.verifyCode(userId, code),
      { 
        retryCount: 3,
        retryDelay: 1000,
        operationName: 'LINE API 驗證' 
      }
    );

    return res.status(200).json(result);
  } catch (error) {
    logger.error('驗證處理失敗:', error);
    return res.status(500).json({
      success: false,
      message: '系統發生錯誤，請稍後再試'
    });
  }
} 