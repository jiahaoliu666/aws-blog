import { NextApiRequest, NextApiResponse } from 'next';
import { validateVerificationCode } from '@/utils/lineUtils';
import { logger } from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: '方法不允許' 
    });
  }

  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        message: '缺少必要參數'
      });
    }

    if (!validateVerificationCode(code)) {
      return res.status(400).json({
        success: false,
        message: '驗證碼格式不正確'
      });
    }

    // TODO: 實作驗證碼驗證邏輯
    // 這裡應該要和資料庫中的驗證碼進行比對

    return res.status(200).json({
      success: true,
      message: '驗證成功'
    });

  } catch (error) {
    logger.error('驗證處理失敗:', error);
    return res.status(500).json({
      success: false,
      message: '系統發生錯誤，請稍後再試'
    });
  }
} 