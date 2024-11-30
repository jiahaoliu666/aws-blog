import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '@/services/authService';
import { DbService } from '@/services/dbService';
import { logger } from '@/utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const { password } = req.body;
  const userId = req.headers['x-user-id'] as string;
  const userSub = req.headers['x-user-sub'] as string;

  if (!userId || !password || !userSub) {
    return res.status(400).json({ message: '缺少必要參數' });
  }

  try {
    const authService = new AuthService();
    const dbService = new DbService();

    // 1. 驗證密碼
    await authService.verifyUserPassword(userSub, password);
    
    // 2. 刪除資料庫和 S3 資料
    await dbService.deleteUserCompletely(userId);
    
    // 3. 刪除 Cognito 用戶
    await authService.deleteUserFromCognito(userSub);

    logger.info('用戶刪除成功:', { userId, userSub });
    return res.status(200).json({ message: '帳號已成功刪除' });

  } catch (error) {
    logger.error('刪除帳號失敗:', { userId, error });
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : '刪除帳號失敗'
    });
  }
}