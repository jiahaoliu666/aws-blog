import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import nodemailer from 'nodemailer';

const s3Client = new S3Client({
  region: 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { title, content, email, image } = req.body;

  let imageUrl = '';

  try {
    if (image) {
      console.log('Received image for upload');
      // 確保 image 是 base64 格式，並且去掉前綴
      const buffer = Buffer.from(image.split(',')[1], 'base64');
      console.log('Image buffer length:', buffer.length);
      const params = {
        Bucket: 'aws-blog-feedback',
        Key: `feedback-images/${email}-${Date.now()}.png`,
        Body: buffer,
        ContentType: 'image/png',
      };
      const command = new PutObjectCommand(params);
      try {
        console.log('Attempting to upload image to S3');
        console.log('S3 upload parameters:', params);
        await s3Client.send(command);
        imageUrl = `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
        console.log('Image uploaded successfully:', imageUrl);
      } catch (s3Error) {
        console.error('S3 upload error:', s3Error);
        throw new Error('Failed to upload image to S3');
      }
    } else {
      console.log('No image provided for upload');
    }
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image');
  }

  // 使用 nodemailer 發送電子郵件
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.GMAIL_USER, // 確保這裡的用戶名正確
      pass: process.env.GMAIL_PASS, // 確保這裡的密碼或應用專用密碼正確
    },
  });

  const mailOptions = {
    from: email,
    to: 'awsblogfeedback@gmail.com', // 替換為接收反饋的電子郵件
    subject: `標題: ${title}`,
    text: `
      Feedback from: ${email}
      Title: ${title}
      Content: ${content}
      Image URL: ${imageUrl ? imageUrl : 'No image provided'}
    `,
    html: `
      <h2>AWS Blog 反饋內容</h2>
      <p><strong>寄件人：</strong> ${email}</p>
      <p><strong>標題：</strong> ${title}</p>
      <p><strong>內容：</strong></p>
      <p>${content}</p>
      ${imageUrl ? `<p><strong>圖片：</strong></p><img src="${imageUrl}" alt="Feedback Image" style="max-width: 100%; height: auto;" />` : '<p><strong>圖片：</strong>未提供</p>'}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Feedback sent successfully' });
  } catch (error) {
    const err = error as Error;
    console.error('Error sending feedback:', err);
    // 添加更多的錯誤信息
    console.error('Error details:', err.stack);
    res.status(500).json({ message: 'Error sending feedback', error: err.message });
  }
}
