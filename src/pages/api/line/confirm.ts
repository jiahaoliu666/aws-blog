import { NextApiRequest, NextApiResponse } from 'next';
import { lineService } from '@/services/lineService';
import { logger } from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, code } = req.body;

  try {
    const isValid = await lineService.verifyCode(userId, code);
    if (isValid) {
      // 更新用戶的 LINE 設定
      await lineService.updateLineSettings(userId, req.body.lineId, true);
      return res.status(200).json({ success: true });
    }
    return res.status(400).json({ success: false, message: '驗證碼無效或已過期' });
  } catch (error) {
    logger.error('驗證碼確認失敗:', error);
    return res.status(500).json({ success: false, message: '驗證過程發生錯誤' });
  }
} 