import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '@/services/authService';
import { DbService } from '@/services/dbService';
import { EmailService } from '@/services/emailService';
import { logger } from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const { password } = req.body;
  const userId = req.headers['x-user-id'] as string;
  const email = req.headers['x-user-email'] as string;

  if (!password || !userId) {
    logger.error('缺少必要參數:', { 
      hasPassword: !!password,
      hasUserId: !!userId
    });
    return res.status(400).json({ message: '缺少必要參數' });
  }

  const authService = new AuthService();
  const dbService = new DbService();

  try {
    // 驗證密碼
    await authService.verifyPassword(userId, password);

    // 刪除用戶資料
    await dbService.deleteUserWithTransaction(userId);

    // 從 Cognito 刪除用戶
    await authService.deleteUserFromCognito(userId);

    return res.status(200).json({ message: '帳號已成功刪除' });

  } catch (error) {
    logger.error('刪除帳號時發生錯誤:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : '刪除帳號失敗，請稍後重試'
    });
  }
}