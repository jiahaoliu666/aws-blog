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

    // 生成 HTML 內容，使用 table 佈局
    const htmlContent = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>AWS Blog 365 通知</title>
        </head>
        <body style="margin: 0; padding: 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-family: Arial, sans-serif;">
            <!-- 外層容器 -->
            <tr>
              <td align="center" style="padding: 20px 0;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  
                  <!-- 標題區域 -->
                  <tr>
                    <td align="center" style="padding: 30px 40px 20px 40px; background-color: #232F3E; border-radius: 8px 8px 0 0;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="color: #FFFFFF; font-size: 24px; font-weight: bold; text-align: center;">
                            ${articleData.title}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- 內容區域 -->
                  <tr>
                    <td style="padding: 30px 40px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; color: #444444; font-size: 16px; line-height: 24px;">
                            ${articleData.content}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- 按鈕區域 -->
                  <tr>
                    <td align="center" style="padding: 0 40px 30px 40px;">
                      <table border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" bgcolor="#FF9900" style="border-radius: 4px;">
                            <a href="${articleData.link}" 
                               target="_blank"
                               style="display: inline-block; padding: 12px 30px; font-size: 16px; color: #232F3E; text-decoration: none; font-weight: bold;">
                              閱讀全文
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- 頁尾區域 -->
                  <tr>
                    <td style="padding: 20px 40px 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center" style="color: #666666; font-size: 14px; line-height: 20px;">
                            <p style="margin: 0;">此為系統自動發送的通知郵件，請勿直接回覆</p>
                            <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} AWS Blog 365. All rights reserved.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
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