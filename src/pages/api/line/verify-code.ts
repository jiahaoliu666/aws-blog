import { NextApiRequest, NextApiResponse } from 'next';
import { validateVerificationCode } from '@/utils/lineUtils';
import { logger } from '@/utils/logger';
import { lineService } from '@/services/lineService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ message: '缺少必要參數' });
    }

    logger.info('接收到驗證請求:', { userId, code });

    const result = await lineService.verifyCode(userId, code);

    if (!result.success) {
      return res.status(400).json({ message: result.message || '驗證失敗' });
    }

    res.status(200).json({ success: true, message: '驗證成功' });
  } catch (error) {
    logger.error('驗證處理失敗:', error);
    res.status(500).json({ message: '驗證處理失敗，請稍後再試' });
  }
} 