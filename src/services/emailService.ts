import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { EmailNotification } from '../types/emailTypes';

const ses = new SESClient({
  region: 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

export const sendEmailNotification = async (emailData: EmailNotification) => {
  if (!process.env.SES_SENDER_EMAIL) {
    throw new Error('未設置發件人郵箱');
  }

  const params = {
    Source: process.env.SES_SENDER_EMAIL,
    Destination: {
      ToAddresses: [emailData.to]
    },
    Message: {
      Subject: {
        Data: emailData.subject,
        Charset: 'UTF-8'
      },
      Body: {
        Html: {
          Data: emailData.content,
          Charset: 'UTF-8'
        }
      }
    }
  };

  try {
    await ses.send(new SendEmailCommand(params));
    console.log(`成功發送郵件至 ${emailData.to}`);
    return { success: true };
  } catch (error) {
    console.error('發送郵件失敗:', error);
    throw error;
  }
}; 