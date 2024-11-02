import type { NextApiRequest, NextApiResponse } from 'next';
import { sendEmailNotification } from '../../../services/emailService';
import { generateNewsNotificationEmail } from '../../../templates/emailTemplates';
import { EmailNotification } from '../../../types/emailTypes';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    const { email, articleData } = req.body;

    const emailContent = generateNewsNotificationEmail(articleData);
    
    const emailData: EmailNotification = {
      to: email,
      subject: '新的 AWS 部落格文章通知',
      content: emailContent,
      articleData,
    };

    await sendEmailNotification(emailData);
    
    res.status(200).json({ message: '郵件發送成功' });
  } catch (error) {
    console.error('發送郵件通知時發生錯誤:', error);
    res.status(500).json({ message: '發送郵件失敗' });
  }
} 