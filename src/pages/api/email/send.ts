import { NextApiRequest, NextApiResponse } from 'next';
import { EmailService } from '../../../services/emailService';
import { validateEmailConfig } from '../../../config/email';
import { logger } from '../../../utils/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允許' });
  }

  try {
    validateEmailConfig();
    
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: '缺少必要參數' });
    }

    const emailService = new EmailService();
    const result = await emailService.sendEmail({ to, subject, html });

    if (!result.success) {
      throw new Error(result.error || '發送郵件失敗');
    }

    logger.info('API: 成功發送郵件', { to });
    res.status(200).json({ success: true, messageId: result.messageId });
  } catch (error) {
    logger.error('API: 發送郵件失敗', { error });
    res.status(500).json({ 
      error: error instanceof Error ? error.message : '發送郵件時發生未知錯誤' 
    });
  }
} 