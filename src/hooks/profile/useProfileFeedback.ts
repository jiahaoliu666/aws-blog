import { useState } from 'react';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { User } from '@/types/userType';
import { logger } from '@/utils/logger';
import { toast } from 'react-toastify';

interface FeedbackData {
  title: string;
  content: string;
  category: string;
  rating?: number;
  attachments?: File[];
}

interface UseProfileFeedbackProps {
  user: User | null;
}

export const useProfileFeedback = ({ user }: UseProfileFeedbackProps) => {
  const [feedback, setFeedback] = useState<FeedbackData>({
    title: '',
    content: '',
    category: '',
    rating: 0
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const sesClient = new SESClient({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const s3Client = new S3Client({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const validateFeedback = (data: FeedbackData): boolean => {
    if (!data.title.trim()) {
      toast.error('請輸入標題');
      return false;
    }

    if (!data.content.trim()) {
      toast.error('請輸入反饋內容');
      return false;
    }

    if (!data.category) {
      toast.error('請選擇反饋類別');
      return false;
    }

    return true;
  };

  const uploadAttachments = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
        continue;
      }

      const fileKey = `feedback-attachments/${user?.sub}/${Date.now()}-${file.name}`;
      const uploadParams = {
        Bucket: 'aws-blog-feedback',
        Key: fileKey,
        Body: file,
        ContentType: file.type,
        ACL: 'public-read' as const
      };

      const uploadCommand = new PutObjectCommand(uploadParams);
      await s3Client.send(uploadCommand);

      uploadedUrls.push(
        `https://aws-blog-feedback.s3.amazonaws.com/${fileKey}`
      );
    }

    return uploadedUrls;
  };

  const handleSubmitFeedback = async () => {
    if (!user?.sub) {
      toast.error('請先登入');
      return;
    }

    if (!validateFeedback(feedback)) return;

    try {
      setIsSubmitting(true);
      setFeedbackMessage('正在提交反饋...');

      // 上傳附件
      const attachmentUrls = attachments.length > 0 
        ? await uploadAttachments(attachments)
        : [];

      // 發送郵件
      const emailParams = {
        Destination: {
          ToAddresses: ['awsblogfeedback@gmail.com'],
        },
        Message: {
          Body: {
            Html: {
              Data: `
                <h2>用戶反饋</h2>
                <p><strong>標題：</strong> ${feedback.title}</p>
                <p><strong>類別：</strong> ${feedback.category}</p>
                <p><strong>內容：</strong></p>
                <p>${feedback.content}</p>
                ${attachmentUrls.length > 0 ? `
                  <p><strong>附件：</strong></p>
                  <ul>
                    ${attachmentUrls.map(url => `<li><a href="${url}">查看附件</a></li>`).join('')}
                  </ul>
                ` : ''}
                <hr>
                <p><strong>用戶資訊：</strong></p>
                <p>用戶 ID：${user?.sub}</p>
                <p>電子郵件：${user?.email}</p>
                <p>姓名：${user?.username}</p>
                <p>提交時間：${new Date().toLocaleString()}</p>
              `
            }
          },
          Subject: {
            Data: `[用戶反饋] ${feedback.category}: ${feedback.title}`
          }
        },
        Source: 'mail@awsblog365.com',
      };

      console.log('準備發送郵件:', emailParams);

      try {
        const command = new SendEmailCommand(emailParams);
        const response = await sesClient.send(command);
        console.log('郵件發送成功，回應:', response);
      } catch (error) {
        console.error('郵件發送失敗:', error);
        throw error;
      }

      setFeedbackMessage('反饋已提交');
      toast.success('感謝您的反饋！');
      resetFeedbackForm();

    } catch (error) {
      console.error('提交反饋失敗:', error);
      setFeedbackMessage('提交反饋失敗');
      toast.error('提交反饋失敗，請稍後重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => {
      const isValid = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isValid) {
        toast.error(`${file.name} 格式不支援，僅支援 JPEG 和 PNG 格式`);
      }
      return isValid;
    });

    if (validFiles.length > 0) {
      setAttachments(validFiles);
      toast.success(`成功添加 ${validFiles.length} 個附件`);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const resetFeedbackForm = () => {
    setFeedback({
      title: '',
      content: '',
      category: '',
      rating: 0
    });
    setAttachments([]);
    setFeedbackMessage(null);
  };

  return {
    feedback,
    setFeedback,
    attachments,
    isSubmitting,
    feedbackMessage,
    handleSubmitFeedback,
    handleAttachmentChange,
    removeAttachment,
    resetFeedbackForm
  };
}; 