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
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: '缺少必要參數' });
    }

    const code = await lineService.generateVerificationCode(userId);
    
    res.status(200).json({
      success: true,
      code,
      message: '驗證碼已生成'
    });
  } catch (error) {
    console.error('生成驗證碼時發生錯誤:', error);
    res.status(500).json({
      success: false,
      message: '生成驗證碼失敗'
    });
  }
} 