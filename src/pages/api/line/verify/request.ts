import { NextApiRequest, NextApiResponse } from 'next';
import { lineService } from '@/services/lineService';
import { logger } from '@/utils/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    const { userId, lineId } = req.body;
    
    if (!userId || !lineId) {
      return res.status(400).json({ 
        success: false,
        message: '缺少必要參數：需要 userId 和 lineId' 
      });
    }

    logger.info('開始生成驗證碼', { userId, lineId });

    const code = await lineService.generateVerificationCode(userId);
    
    await lineService.saveVerificationInfo({
      userId,
      lineId,
      code,
      createdAt: new Date().toISOString()
    });

    logger.info('驗證碼生成成功', { userId, code });
    
    res.status(200).json({
      success: true,
      code,
      message: '驗證碼已生成，請在 LINE 上查收'
    });
  } catch (error) {
    logger.error('生成驗證碼時發生錯誤:', error);
    res.status(500).json({
      success: false,
      message: '生成驗證碼失敗，請稍後再試'
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
}; 