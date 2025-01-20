import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import nodemailer from 'nodemailer';

interface Attachment {
  url: string;
  name: string;
}

// 創建 S3 客戶端
const s3Client = new S3Client({
  region: 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// 驗證 SMTP 配置
const validateSmtpConfig = () => {
  const requiredVars = ['SMTP_HOST', 'SMTP_USERNAME', 'SMTP_PASSWORD', 'SMTP_SENDER_EMAIL'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`缺少必要的 SMTP 配置: ${missingVars.join(', ')}`);
  }
};

// 創建 SMTP 傳輸器
const createTransporter = async () => {
  validateSmtpConfig();
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // 驗證傳輸器配置
  await transporter.verify();
  return transporter;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { title, content, email, category, image, attachments } = req.body;

  let imageUrl = '';
  let attachmentFiles: Attachment[] = [];

  try {
    // 驗證必要參數
    if (!title || !content || !email || !category) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必要參數' 
      });
    }

    // 處理單一圖片上傳
    if (image) {
      try {
        const buffer = Buffer.from(image.split(',')[1], 'base64');
        const params = {
          Bucket: 'aws-blog-feedback',
          Key: `feedback-images/${email}-${Date.now()}.png`,
          Body: buffer,
          ContentType: 'image/png',
        };
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        imageUrl = `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
      } catch (s3Error) {
        throw new Error('圖片上傳失敗');
      }
    }

    // 處理多個附件
    if (attachments && Array.isArray(attachments)) {
      attachmentFiles = attachments;
    }

    // 初始化郵件傳輸器
    const transporter = await createTransporter();

    // 準備郵件內容
    const mailOptions = {
      from: process.env.SMTP_SENDER_EMAIL,
      to: 'awsblogfeedback@gmail.com',
      subject: `[用戶反饋] ${category}: ${title}`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #232f3e; margin: 0;">AWS Blog 365 用戶反饋</h1>
              </div>
              
              <div style="background-color: #ffffff; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                <h2 style="color: #232f3e; margin-top: 0;">反饋內容</h2>
                <p style="line-height: 1.6;"><strong>標題：</strong> ${title}</p>
                <p style="line-height: 1.6;"><strong>類別：</strong> ${category}</p>
                <p style="line-height: 1.6;"><strong>內容：</strong></p>
                <p style="line-height: 1.6;">${content}</p>
                
                ${imageUrl || attachmentFiles.length > 0 ? `
                  <div style="margin-top: 20px;">
                    <p style="line-height: 1.6;"><strong>附件：</strong></p>
                    ${imageUrl ? `
                      <div style="margin-bottom: 10px;">
                        <img src="${imageUrl}" alt="Feedback Image" style="max-width: 100%; height: auto;" />
                      </div>
                    ` : ''}
                    ${attachmentFiles.length > 0 ? `
                      <ul style="line-height: 1.6;">
                        ${attachmentFiles.map((file, index) => `
                          <li>
                            <a href="${file.url}" style="color: #0066c0;">${file.name}</a>
                          </li>
                        `).join('')}
                      </ul>
                    ` : ''}
                  </div>
                ` : ''}
              </div>

              <div style="background-color: #ffffff; padding: 20px; border-radius: 6px;">
                <h2 style="color: #232f3e; margin-top: 0;">用戶資訊</h2>
                <p style="line-height: 1.6;"><strong>電子郵件：</strong>${email}</p>
                <p style="line-height: 1.6;"><strong>提交時間：</strong>${new Date().toLocaleString()}</p>
              </div>

              <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
              <div style="text-align: center; color: #666; font-size: 14px;">
                <p>此為系統自動發送郵件，請勿直接回覆</p>
                <p style="margin-top: 10px;">AWS Blog 365 團隊敬上</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    // 發送郵件
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      message: 'Feedback sent successfully',
      success: true,
      imageUrl: imageUrl || null,
      attachments: attachmentFiles
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error sending feedback', 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    });
  }
}
