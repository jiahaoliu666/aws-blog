import { useState, useEffect } from 'react';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
  initialAttachments?: File[];
}

interface UseProfileFeedbackReturn {
  feedback: FeedbackData;
  setFeedback: (feedback: FeedbackData) => void;
  attachments: File[];
  setAttachments: (files: File[]) => void;
  isSubmitting: boolean;
  feedbackMessage: string | null;
  handleSubmitFeedback: (submitData: {
    title: string;
    content: string;
    category: string;
    attachments: File[];
  }) => Promise<void>;
  handleAttachmentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeAttachment: (index: number) => void;
  resetFeedbackForm: () => void;
}

export const useProfileFeedback = ({ 
  user,
  initialAttachments = []
}: UseProfileFeedbackProps): UseProfileFeedbackReturn => {
  const [feedback, setFeedback] = useState<FeedbackData>({
    title: '',
    content: '',
    category: '',
    rating: 0
  });
  const [attachments, setAttachments] = useState<File[]>(initialAttachments);
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
    endpoint: `https://s3.ap-northeast-1.amazonaws.com`,
    forcePathStyle: true,
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

      try {
        const fileKey = `feedback-attachments/${user?.sub}/${Date.now()}-${file.name}`;
        
        // 使用 presigned URL 進行上傳
        const putObjectCommand = new PutObjectCommand({
          Bucket: 'aws-blog-feedback',
          Key: fileKey,
          ContentType: file.type,
        });

        // 獲取預簽名 URL
        const presignedUrl = await getSignedUrl(s3Client, putObjectCommand, {
          expiresIn: 3600,
        });

        // 使用 fetch 上傳文件
        const uploadResponse = await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        // 構建公開訪問 URL
        const publicUrl = `https://aws-blog-feedback.s3.ap-northeast-1.amazonaws.com/${fileKey}`;
        uploadedUrls.push(publicUrl);
        
        console.log('File uploaded successfully:', publicUrl);
      } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
      }
    }

    return uploadedUrls;
  };

  const handleSubmitFeedback = async (submitData: {
    title: string;
    content: string;
    category: string;
    attachments: File[];
  }) => {
    if (!user?.sub) {
      toast.error('請先登入');
      return;
    }

    if (!validateFeedback(submitData)) return;

    try {
      setIsSubmitting(true);
      setFeedbackMessage('正在提交反饋...');

      // 檢查是否有附件需要上傳
      let attachmentUrls: string[] = [];
      if (submitData.attachments && submitData.attachments.length > 0) {
        console.log('開始上傳附件:', submitData.attachments);
        attachmentUrls = await uploadAttachments(submitData.attachments);
        console.log('附件上傳完成:', attachmentUrls);
      }

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
                <p><strong>標題：</strong> ${submitData.title}</p>
                <p><strong>類別：</strong> ${submitData.category}</p>
                <p><strong>內容：</strong></p>
                <p>${submitData.content}</p>
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
                <p>用戶名稱：${user?.username}</p>
                <p>提交時間：${new Date().toLocaleString()}</p>
              `
            }
          },
          Subject: {
            Data: `[用戶反饋] ${submitData.category}: ${submitData.title}`
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
      throw error;
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

  useEffect(() => {
    // 監聽側邊欄切換事件
    const handleSectionChange = (event: CustomEvent) => {
      const newSection = event.detail;
      if (newSection !== 'feedback') {
        resetFeedbackForm();
      }
    };

    window.addEventListener('sectionChange', handleSectionChange as EventListener);

    return () => {
      window.removeEventListener('sectionChange', handleSectionChange as EventListener);
    };
  }, []);

  return {
    feedback,
    setFeedback,
    attachments,
    setAttachments,
    isSubmitting,
    feedbackMessage,
    handleSubmitFeedback,
    handleAttachmentChange,
    removeAttachment,
    resetFeedbackForm
  };
}; 