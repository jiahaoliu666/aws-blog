import type { NextApiRequest, NextApiResponse } from 'next';
import { EmailService } from '../../../services/emailService';
import { errorHandler } from '../../../utils/errorHandler';
import { logger } from '@/utils/logger';

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

    await emailService.sendEmail({
      to: email,
      subject: '新的 AWS 部落格文章通知',
      content: '',
      articleData,
    });

    logger.info(`成功發送郵件至 ${email}`);
    res.status(200).json({ success: true });
  } catch (error) {
    const errorResponse = errorHandler.handle(error);
    res.status(500).json(errorResponse);
  }
} 