import type { NextApiRequest, NextApiResponse } from 'next';
import { EmailService } from '../../../services/emailService';
import { errorHandler } from '../../../utils/errorHandler';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/errorHandler';

const emailService = new EmailService();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    const { email, articleData } = req.body;

    if (!email || !articleData) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要參數' 
      });
    }

    const result = await emailService.sendEmail({
      to: email,
      subject: '新的 AWS 部落格文章通知',
      content: '',
      articleData,
    });

    if (!result.success) {
      throw new AppError(result.error || '發送郵件失敗', 500);
    }

    logger.info(`成功發送郵件至 ${email}`);
    res.status(200).json({ success: true, messageId: result.messageId });
  } catch (error) {
    const errorResponse = errorHandler.handle(error);
    res.status(500).json(errorResponse);
  }
} 