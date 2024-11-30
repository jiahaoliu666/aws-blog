import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '@/services/authService';
import { DbService } from '@/services/dbService';
import { logger } from '@/utils/logger';
import { EmailService } from '@/services/emailService';
import { generateAccountDeletionEmail } from '@/templates/deleteAccountEmail';
import { DB_TABLES } from '@/config/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const { password } = req.body;
  const userId = req.headers['x-user-id'] as string;
  const userSub = req.headers['x-user-sub'] as string;
  const userEmail = req.headers['x-user-email'] as string;

  if (!password || !userId || !userSub || !userEmail) {
    logger.error('缺少必要參數');
    return res.status(400).json({ message: '缺少必要參數' });
  }

  const authService = new AuthService();
  const dbService = new DbService();
  const emailService = new EmailService();

  try {
    logger.info('開始帳號刪除流程:', { userId, userSub });
    
    // 驗證密碼
    await authService.verifyPassword(userSub, password);
    logger.info('密碼驗證成功:', { userSub });

    // 開始刪除流程
    await dbService.deleteUserCompletely(userId, userSub);
    logger.info('用戶資料刪除成功:', { userId });

    // 發送刪除確認郵件
    const emailContent = generateAccountDeletionEmail({ title: '帳號刪除確認', content: '您的帳號已成功刪除。' });
    await emailService.sendEmail({
      to: userEmail,
      subject: '帳號刪除確認',
      content: emailContent,
      articleData: {
        title: '帳號刪除確認',
        content: '您的帳號已成功刪除'
      }
    });
    logger.info('刪除確認郵件發送成功:', { userEmail });

    return res.status(200).json({ message: '帳號已成功刪除' });
    
  } catch (error) {
    logger.error('刪除帳號失敗:', error);
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    
    switch (errorMessage) {
      case '密碼錯誤':
        return res.status(401).json({ message: '密碼錯誤' });
      case '用戶不存在':
        return res.status(404).json({ message: '用戶不存在' });
      case '超過速率限制':
        return res.status(429).json({ message: '請求過於頻繁，請稍後再試' });
      default:
        return res.status(500).json({ 
          message: '刪除帳號時發生錯誤',
          error: errorMessage
        });
    }
  }
}