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

  const { password, userId, userSub } = req.body;
  
  // 檢查必要參數
  if (!password || !userId || !userSub) {
    return res.status(400).json({ message: '缺少必要參數' });
  }

  try {
    const dbService = new DbService();
    await dbService.handleAccountDeletion(userId, userSub, password);
    
    // 發送帳號刪除確認郵件
    const emailService = new EmailService();
    await emailService.sendEmail({
      to: req.body.email,
      subject: '帳號刪除確認',
      content: generateAccountDeletionEmail({
        title: '帳號已成功刪除',
        content: '您的帳號已經成功刪除。感謝您使用我們的服務。'
      }),
      articleData: {
        title: '帳號刪除確認',
        content: '您的帳號已經成功刪除'
      }
    });

    return res.status(200).json({ message: '帳號已成功刪除' });
  } catch (error) {
    logger.error('刪除帳號時發生錯誤:', error);
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    
    if (errorMessage.includes('密碼驗證失敗')) {
      return res.status(401).json({ message: '密碼驗證失敗，請確認密碼是否正確' });
    } else if (errorMessage.includes('用戶不存在')) {
      return res.status(404).json({ message: '用戶不存在' });
    } else {
      return res.status(500).json({ 
        message: '刪除帳號時發生錯誤',
        error: errorMessage
      });
    }
  }
}