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
  
  if (!password || !userId || !userSub) {
    logger.error('缺少必要參數:', { userId, userSub, hasPassword: !!password });
    return res.status(400).json({ 
      message: '缺少必要參數',
      details: {
        hasUserId: !!userId,
        hasUserSub: !!userSub,
        hasPassword: !!password
      }
    });
  }

  const authService = new AuthService();
  const dbService = new DbService();

  try {
    // 1. 先驗證密碼
    const isPasswordValid = await authService.verifyPassword(userSub, password);
    if (!isPasswordValid) {
      logger.error('密碼驗證失敗:', { userId, userSub });
      return res.status(401).json({ 
        message: '密碼驗證失敗',
        code: 'INVALID_PASSWORD'
      });
    }

    // 2. 執行帳號刪除流程
    await dbService.handleAccountDeletion(userId, userSub, password);
    
    return res.status(200).json({ message: '帳號刪除成功' });

  } catch (error) {
    logger.error('刪除帳號失敗:', {
      userId,
      error: error instanceof Error ? error.message : '未知錯誤',
      stack: error instanceof Error ? error.stack : undefined
    });

    // 更詳細的錯誤處理
    if (error instanceof Error) {
      if (error.message.includes('密碼錯誤')) {
        return res.status(401).json({ 
          message: '密碼驗證失敗',
          code: 'INVALID_PASSWORD'
        });
      }
      if (error.message.includes('用戶不存在')) {
        return res.status(404).json({ 
          message: '用戶不存在',
          code: 'USER_NOT_FOUND'
        });
      }
    }
    
    return res.status(500).json({ 
      message: '刪除帳號時發生錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
}