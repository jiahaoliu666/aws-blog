import { NextApiRequest, NextApiResponse } from 'next';
import { lineService } from '@/services/lineService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    const { userId, code, lineId } = req.body;
    
    if (!userId || !code || !lineId) {
      return res.status(400).json({ message: '缺少必要參數' });
    }

    const isValid = await lineService.verifyCode(userId, code);
    
    if (isValid) {
      // 更新用戶的 LINE 設定
      await lineService.updateLineSettings(userId, lineId, true);
      
      res.status(200).json({
        success: true,
        message: '驗證成功'
      });
    } else {
      res.status(400).json({
        success: false,
        message: '驗證碼無效或已過期'
      });
    }
  } catch (error) {
    console.error('驗證碼確認時發生錯誤:', error);
    res.status(500).json({
      success: false,
      message: '驗證失敗'
    });
  }
} 