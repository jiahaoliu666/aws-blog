import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { api } from '@/api/user';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/utils/errorHandler';
import { DbService } from '@/services/dbService';
import { AuthService } from '@/services/authService';
import { sendEmail } from '@/services/emailService';
import RateLimiter from '@/utils/rateLimiter';

const limiter = new RateLimiter(5, 15 * 60); // 15分鐘內最多5次請求

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const dbService = new DbService();
  const authService = new AuthService();

  try {
    // 應用速率限制
    const isAllowed = await limiter.check(req, res);
    if (!isAllowed) {
      return res.status(429).json({ message: '請求過於頻繁，請稍後再試' });
    }

    const session = await getSession({ req });
    
    if (!session?.user) {
      return res.status(401).json({ message: '未授權的請求' });
    }

    const { password } = req.body;
    const userId = session.user.email;
    if (!userId) {
      return res.status(400).json({ message: '無效的用戶信箱' });
    }
    const userEmail = userId;

    if (!password) {
      return res.status(400).json({ message: '請提供密碼' });
    }

    // 驗證密碼
    const isPasswordValid = await authService.validatePassword(userId, password);
    
    if (!isPasswordValid) {
      logger.warn('刪除帳號密碼驗證失敗', { userId });
      return res.status(401).json({ message: '密碼錯誤' });
    }

    // 執行刪除帳號操作
    await dbService.deleteUserAccount(userId);

    // 發送確認郵件
    await sendEmail({
      to: userEmail,
      subject: '帳號刪除確認',
      content: `${session.user.name}，您的帳號已被刪除`,
      articleData: {
        title: '帳號刪除確認',
        content: `${session.user.name}，您的帳號已被刪除`
      }
    });

    res.status(200).json({ message: '帳號已成功刪除' });
  } catch (error) {
    logger.error(`刪除帳號時發生錯誤: ${error}`);
    return errorHandler.handle(error);
  }
}