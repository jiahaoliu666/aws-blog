import { NextApiRequest, NextApiResponse } from 'next';
import { lineService } from '../../../services/lineService';
import { logger } from '../../../utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const { userId, lineId, code } = req.body;

    if (!userId || !lineId || !code) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數'
      });
    }

    const isVerified = await lineService.verifyCode(lineId, code);

    if (isVerified) {
      return res.status(200).json({
        success: true,
        message: '驗證成功'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: '驗證碼錯誤或已過期'
      });
    }
  } catch (error) {
    logger.error('驗證失敗:', error);
    return res.status(500).json({
      success: false,
      message: '驗證處理失敗'
    });
  }
} 