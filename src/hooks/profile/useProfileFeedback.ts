import { useState } from 'react';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
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

  const dynamoClient = new DynamoDBClient({
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
      const fileKey = `feedback-attachments/${user?.sub}/${Date.now()}-${file.name}`;
      const uploadParams = {
        Bucket: 'your-s3-bucket-name',
        Key: fileKey,
        Body: file,
        ContentType: file.type,
        ACL: 'public-read' as const
      };

      const uploadCommand = new PutObjectCommand(uploadParams);
      await s3Client.send(uploadCommand);

      uploadedUrls.push(
        `https://your-s3-bucket-name.s3.amazonaws.com/${fileKey}`
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

      // 上傳附件（如果有）
      const attachmentUrls = attachments.length > 0 
        ? await uploadAttachments(attachments)
        : [];

      // 儲存反饋
      const params = {
        TableName: 'AWS_Blog_UserFeedback',
        Item: {
          id: { S: `${user.sub}-${Date.now()}` },
          userId: { S: user.sub },
          title: { S: feedback.title },
          content: { S: feedback.content },
          category: { S: feedback.category },
          rating: { N: feedback.rating?.toString() || '0' },
          attachments: { SS: attachmentUrls },
          status: { S: 'pending' },
          createdAt: { S: new Date().toISOString() }
        }
      };

      const command = new PutItemCommand(params);
      await dynamoClient.send(command);

      setFeedbackMessage('反饋已提交');
      toast.success('感謝您的反饋！');
      resetFeedbackForm();

    } catch (error) {
      logger.error('提交反饋失敗:', error);
      setFeedbackMessage('提交反饋失敗');
      toast.error('提交反饋失敗，請稍後重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
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