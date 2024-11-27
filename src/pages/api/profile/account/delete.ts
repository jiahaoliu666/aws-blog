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

const limiter = new RateLimiter(5, 15 * 60);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    const { password, email } = req.body;
    logger.info('接收刪除帳戶請求:', { email });

    if (!password || !email) {
      logger.warn('缺少必要參數');
      return res.status(400).json({ 
        success: false,
        message: '缺少必要參數' 
      });
    }

    const authService = new AuthService();
    const dbService = new DbService();

    // 驗證密碼
    logger.info('開始驗證用戶密碼:', { email });
    const isValidPassword = await authService.validateUserPassword(email, password);
    
    if (!isValidPassword) {
      logger.warn('密碼驗證失敗:', { email });
      return res.status(401).json({
        success: false,
        message: '密碼錯誤'
      });
    }

    // 刪除用戶的 S3 檔案
    try {
      await dbService.deleteUserS3Files(email);
    } catch (s3Error) {
      logger.error('刪除用戶 S3 檔案時發生錯誤:', {
        error: s3Error,
        email
      });
      // 不中斷流程，繼續刪除其他資料
    }

    // 先刪除資料庫中的用戶資料
    try {
      logger.info('開始從資料庫刪除用戶資料:', { email });
      await dbService.deleteUserAccount(email);
      logger.info('資料庫用戶資料刪除成功:', { email });
    } catch (dbError: any) {
      logger.error('刪除資料庫資料時發生錯誤:', {
        errorName: dbError.name,
        errorMessage: dbError.message,
        email
      });
      throw dbError;
    }

    // 然後刪除 Cognito 用戶
    try {
      logger.info('開始從 Cognito 刪除用戶:', { email });
      await authService.deleteUserFromCognito(email);
      logger.info('Cognito 用戶刪除成功:', { email });
    } catch (cognitoError: any) {
      logger.error('刪除 Cognito 用戶時發生錯誤:', {
        errorName: cognitoError.name,
        errorMessage: cognitoError.message,
        email
      });
      throw cognitoError;
    }

    // 發送確認郵件
    try {
      logger.info('開始發送刪除確認郵件:', { email });
      await sendEmail({
        to: email,
        subject: '帳號刪除確認',
        content: generateAccountDeletionEmail({
          title: '帳號刪除確認',
          content: '您的帳號已被永久刪除，所有相關資料已被清除。'
        }),
        articleData: {
          title: '帳號刪除確認',
          content: '您的帳號已被永久刪除，所有相關資料已被清除。'
        }
      });
      logger.info('刪除確認郵件發送成功:', { email });
    } catch (emailError) {
      logger.error('發送確認郵件時發生錯誤:', { error: emailError, email });
      // 不中斷流程
    }

    return res.status(200).json({
      success: true,
      message: '帳號已永久刪除'
    });

  } catch (error: any) {
    logger.error('刪除帳號時發生錯誤:', {
      errorName: error.name,
      errorMessage: error.message,
      email: req.body.email
    });

    return res.status(500).json({
      success: false,
      message: '刪除帳號時發生錯誤，請稍後重試'
    });
  }
}