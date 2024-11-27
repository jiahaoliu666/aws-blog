import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { api } from '@/api/user';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/utils/errorHandler';
import { DbService } from '@/services/dbService';
import { AuthService } from '@/services/authService';
import { sendEmail } from '@/services/emailService';
import RateLimiter from '@/utils/rateLimiter';
import { generateAccountDeletionEmail } from '@/templates/deleteAccountEmail';

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
    // 添加請求日誌
    console.log('收到刪除帳號請求:', {
      method: req.method,
      body: req.body,
      headers: req.headers
    });

    // 應用速率限制
    const isAllowed = await limiter.check(req, res);
    if (!isAllowed) {
      return res.status(429).json({ 
        success: false,
        message: '請求過於頻繁，請稍後再試' 
      });
    }

    const session = await getSession({ req });
    if (!session?.user) {
      return res.status(401).json({ 
        success: false,
        message: '未授權的請求' 
      });
    }

    const { password } = req.body;
    const userId = session.user.email;
    
    if (!userId || !password) {
      return res.status(400).json({ 
        success: false,
        message: '缺少必要參數' 
      });
    }

    // 驗證密碼
    const isPasswordValid = await authService.validatePassword(userId, password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: '密碼錯誤' 
      });
    }

    // 從 Cognito 刪除用戶
    await authService.deleteUserFromCognito(userId);

    // 從資料庫刪除用戶資料
    await dbService.deleteUserAccount(userId);

    // 發送確認郵件
    try {
      await sendEmail({
        to: userId,
        subject: '帳號刪除確認',
        content: '您的帳號已被永久刪除，所有相關資料已被清除。',
        articleData: {
          title: '帳號刪除確認',
          content: '您的帳號已被永久刪除，所有相關資料已被清除。'
        }
      });
    } catch (emailError) {
      console.error('發送確認郵件失敗:', emailError);
      // 不中斷流程，繼續執行
    }

    return res.status(200).json({ 
      success: true,
      message: '帳號已永久刪除' 
    });
  } catch (error) {
    console.error('刪除帳號時發生錯誤:', error);
    return res.status(500).json({ 
      success: false,
      message: '刪除帳號時發生錯誤，請稍後重試' 
    });
  }
}