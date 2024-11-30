import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '@/services/authService';
import { DbService } from '@/services/dbService';
import { logger } from '@/utils/logger';
import { EmailService } from '@/services/emailService';
import { generateAccountDeletionEmail } from '@/templates/deleteAccountEmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const { password } = req.body;
  const userId = req.headers['x-user-id'] as string;
  const userSub = req.headers['x-user-sub'] as string;
  const userEmail = req.headers['x-user-email'] as string;

  if (!password || !userId || !userSub || !userEmail) {
    return res.status(400).json({ 
      message: '缺少必要參數',
      details: {
        password: !password,
        userId: !userId,
        userSub: !userSub,
        userEmail: !userEmail
      }
    });
  }

  const authService = new AuthService();
  const dbService = new DbService();
  const emailService = new EmailService();

  try {
    // 1. 開始事務
    await dbService.beginTransaction();

    // 2. 驗證密碼並刪除 Cognito 用戶
    await authService.validatePasswordAndDeleteUser(userSub, password);

    // 3. 刪除用戶資料
    await dbService.deleteUserCompletely(userId);

    // 4. 發送確認郵件
    const emailContent = generateAccountDeletionEmail({
      title: '帳號刪除確認',
      content: '您的帳號已成功刪除。感謝您使用我們的服務。'
    });

    await emailService.sendEmail({
      to: userEmail,
      subject: '帳號刪除確認',
      content: emailContent,
      articleData: {
        title: '帳號刪除確認',
        content: emailContent
      }
    });

    // 5. 提交事務
    await dbService.commitTransaction();

    logger.info('用戶帳號刪除成功:', { userId, userSub });
    return res.status(200).json({ message: '帳號已成功刪除' });

  } catch (error) {
    // 發生錯誤時回滾事務
    await dbService.rollbackTransaction();
    
    logger.error('刪除帳號失敗:', { userId, error });
    
    if (error instanceof Error) {
      switch(error.message) {
        case '密碼錯誤':
          return res.status(401).json({ message: '密碼錯誤' });
        case '用戶不存在':
          return res.status(404).json({ message: '用戶不存在' });
        default:
          return res.status(500).json({ message: error.message });
      }
    }
    return res.status(500).json({ message: '刪除帳號時發生未知錯誤' });
  }
}