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

    // 生成 HTML 內容
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5282;">${articleData.title}</h2>
        <div style="padding: 20px; background-color: #f7fafc; border-radius: 8px;">
          <p style="color: #718096;">${articleData.content}</p>
          ${articleData.link ? `
            <a href="${articleData.link}" 
               style="display: inline-block; padding: 10px 20px; 
                      background-color: #4299e1; color: white; 
                      text-decoration: none; border-radius: 5px; 
                      margin-top: 15px;">
              閱讀全文
            </a>
          ` : ''}
        </div>
      </div>
    `;

    const result = await emailService.sendEmail({
      to: email,
      subject: '新的 AWS 部落格文章通知',
      html: htmlContent
    });

    if (!result.success) {
      throw new AppError(result.error || '發送郵件失敗', 500);
    }

    logger.info(`成功發送郵件至 ${email}`);
    res.status(200).json({ success: true });
  } catch (error) {
    const errorResponse = errorHandler.handle(error);
    res.status(500).json(errorResponse);
  }
} 