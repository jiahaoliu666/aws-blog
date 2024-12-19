import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '@/services/authService';
import { DbService } from '@/services/dbService';
import { logger } from '@/utils/logger';
import { EmailService } from '@/services/emailService';
import { generateAccountDeletionEmail } from '@/templates/deleteAccountEmail';
import { DB_TABLES } from '@/config/constants';

const deleteWithRetry = async (dbService: DbService, userId: string, userSub: string, password: string) => {
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await dbService.handleAccountDeletion(userId, userSub, password);
      return;
    } catch (error) {
      lastError = error as Error;
      if (i === maxRetries - 1) break;
      // 指數退避
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw lastError;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const { password, userId, userSub, email, username } = req.body;
  
  if (!password || !userId || !userSub || !email) {
    logger.error('缺少必要參數:', { 
      userId, 
      userSub, 
      hasPassword: !!password,
      hasEmail: !!email 
    });
    return res.status(400).json({ 
      message: '缺少必要參數',
      details: {
        hasUserId: !!userId,
        hasUserSub: !!userSub,
        hasPassword: !!password,
        hasEmail: !!email
      }
    });
  }

  try {
    const dbService = new DbService();
    await dbService.handleAccountDeletion(userId, userSub, password);
    
    // 發送帳號刪除確認郵件
    const emailService = new EmailService();
    const emailContent = generateAccountDeletionEmail({
      title: '【AWS Blog 365】帳號刪除通知',
      content: '',
      username: username || '用戶',
      email: email,
      userId: userId,
      deletedAt: new Date().toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    });
    
    await emailService.sendEmail({
      to: email,
      subject: '【AWS Blog 365】帳號刪除通知',
      content: emailContent,
      articleData: {
        title: '【AWS Blog 365】帳號刪除通知',
        content: emailContent
      }
    });

    return res.status(200).json({ message: '帳號刪除成功' });
    
  } catch (error) {
    logger.error('刪除帳號失敗:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('密碼錯誤')) {
        return res.status(401).json({ 
          message: '密碼驗證失敗',
          code: 'INVALID_PASSWORD',
          details: '請確認您輸入的密碼是否正確'
        });
      }
      if (error.message.includes('DynamoDB 用戶資料不存在')) {
        return res.status(404).json({ 
          message: 'DynamoDB 用戶資料不存在',
          code: 'DYNAMODB_USER_NOT_FOUND',
          details: '找不到對應的用戶資料'
        });
      }
    }
    
    return res.status(500).json({ 
      message: '刪除帳號時發生錯誤',
      error: error instanceof Error ? error.message : '未知錯誤',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}