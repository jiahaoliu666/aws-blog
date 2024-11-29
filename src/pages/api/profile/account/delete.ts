import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '@/services/authService';
import { DbService } from '@/services/dbService';
import { EmailService } from '@/services/emailService';
import { logger } from '@/utils/logger';
import { generateAccountDeletionEmail } from '@/templates/deleteAccountEmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const { password } = req.body;
  const userId = req.headers['x-user-id'] as string;
  const email = req.headers['x-user-email'] as string;

  if (!password || !userId || !email) {
    logger.error('缺少必要參數:', { 
      hasPassword: !!password,
      hasUserId: !!userId,
      hasEmail: !!email,
      headers: req.headers
    });
    return res.status(400).json({ message: '缺少必要參數' });
  }

  try {
    logger.info('開始驗證用戶密碼:', { userId, email });
    
    // 驗證密碼
    const authService = new AuthService();
    await authService.verifyPassword(userId, password);
    
    // 刪除用戶資料
    const dbService = new DbService();
    logger.info('開始刪除用戶資料:', { userId });
    
    // 使用 userId (cognito sub) 刪除對應的資料
    await dbService.deleteUserData(userId);
    
    // 從 Cognito 刪除用戶
    logger.info('開始從 Cognito 刪除用戶:', { userId });
    await authService.deleteUserFromCognito(userId);
    
    // 發送確認郵件
    const emailService = new EmailService();
    const emailContent = generateAccountDeletionEmail({
      title: '帳號刪除確認',
      content: `您的帳號已成功刪除。如有任何問題，請聯繫客服。`
    });
    
    await emailService.sendEmail({
      to: email,
      subject: '帳號刪除確認',
      content: emailContent,
      articleData: {
        title: '帳號刪除確認',
        content: emailContent
      }
    });

    logger.info('帳號刪除成功:', { userId, email });
    return res.status(200).json({ message: '帳號已成功刪除' });

  } catch (error) {
    logger.error('刪除帳號時發生錯誤:', { 
      userId,
      email,
      error: error instanceof Error ? error.message : '未知錯誤'
    });
    
    if (error instanceof Error) {
      if (error.message === '找不到用戶資料') {
        return res.status(404).json({ message: '找不到用戶資料' });
      }
      if (error.message.includes('密碼錯誤')) {
        return res.status(401).json({ message: '密碼錯誤' });
      }
    }
    
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : '刪除帳號失敗，請稍後重試'
    });
  }
}