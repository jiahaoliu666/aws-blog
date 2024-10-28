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

  try {
    let imageUrl = '';
    if (image) {
      const buffer = Buffer.from(image.split(',')[1], 'base64');
      const params = {
        Bucket: 'your-s3-bucket-name',
        Key: `feedback-images/${Date.now()}.png`,
        Body: buffer,
        ContentType: 'image/png',
      };
      const command = new PutObjectCommand(params);
      await s3Client.send(command);
      imageUrl = `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
    }

    // 使用 nodemailer 發送電子郵件
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: email,
      to: 'your-email@example.com',
      subject: `Feedback: ${title}`,
      text: content,
      html: `<p>${content}</p><img src="${imageUrl}" alt="Feedback Image" />`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Feedback sent successfully' });
  } catch (error) {
    console.error('Error sending feedback:', error);
    res.status(500).json({ message: 'Error sending feedback' });
  }
}
