import { useState, useEffect } from 'react';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { User } from '@/types/userType';
import { logger } from '@/utils/logger';
import logActivity from '@/pages/api/profile/activity-log';
import { useToastContext } from '@/context/ToastContext';

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
  const { showToast } = useToastContext();
  const [feedback, setFeedback] = useState<FeedbackData>({
    title: '',
    content: '',
    category: '',
    rating: 0
  });
  const [attachments, setAttachments] = useState<File[]>(initialAttachments);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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
      showToast('請輸入標題', 'error');
      return false;
    }

    if (!data.content.trim()) {
      showToast('請輸入反饋內容', 'error');
      return false;
    }

    if (data.content.length > 500) {
      showToast('反饋內容不能超過500個字', 'error');
      return false;
    }

    if (!data.category) {
      showToast('請選擇反饋類別', 'error');
      return false;
    }

    return true;
  };

  const uploadAttachments = async (files: File[]): Promise<Array<{ url: string; name: string }>> => {
    const uploadedFiles: Array<{ url: string; name: string }> = [];

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
        uploadedFiles.push({
          url: publicUrl,
          name: file.name
        });
        
        console.log('File uploaded successfully:', publicUrl);
      } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
      }
    }

    return uploadedFiles;
  };

  const handleSubmitFeedback = async (submitData: {
    title: string;
    content: string;
    category: string;
    attachments: File[];
  }) => {
    if (!user?.email) {
      showToast('請先登入', 'error');
      return;
    }

    if (!validateFeedback(submitData)) {
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedbackMessage('正在提交反饋...');

      // 上傳附件
      let attachmentFiles: Array<{ url: string; name: string }> = [];
      if (submitData.attachments?.length > 0) {
        try {
          attachmentFiles = await uploadAttachments(submitData.attachments);
          console.log('附件上傳成功:', attachmentFiles);
        } catch (uploadError) {
          console.error('附件上傳失敗:', uploadError);
          showToast('附件上傳失敗，請稍後重試', 'error');
          throw uploadError;
        }
      }

      // 發送反饋到 API 端點
      const response = await fetch('/api/profile/sendFeedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: submitData.title,
          content: submitData.content,
          category: submitData.category,
          email: user.email,
          attachments: attachmentFiles
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '提交反饋失敗');
      }

      // 記錄用戶活動
      await logActivity(user.sub, '成功提交意見反饋');
      
      setFeedbackMessage('反饋已提交');
      showToast('意見已提交，感謝您的反饋！', 'success');
      
      // 重置表單
      resetFeedbackForm();

      // 延遲 1.5 秒後重整頁面
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error('提交反饋失敗:', error);
      setFeedbackMessage('提交反饋失敗');
      showToast('提交反饋失敗，請稍後重試', 'error');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const MAX_ATTACHMENTS = 3; // 定義最大附件數量

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const files = Array.from(e.target.files);
    
    // 檢查是否超過最大附件數量
    if (attachments.length + files.length > MAX_ATTACHMENTS) {
      showToast(`最多只能上傳 ${MAX_ATTACHMENTS} 個檔案`, 'error');
      return;
    }
    
    const validFiles = files.filter(file => {
      const isValid = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isValid) {
        showToast(`${file.name} 格式不支援，僅支援 JPEG 和 PNG 格式`, 'error');
      }
      return isValid;
    });

    if (validFiles.length > 0) {
      // 確保總數不超過限制
      const newAttachments = [...attachments, ...validFiles].slice(0, MAX_ATTACHMENTS);
      setAttachments(newAttachments);
      showToast(`成功添加 ${validFiles.length} 個附件`, 'success');
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