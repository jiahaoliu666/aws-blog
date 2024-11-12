import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/context/AuthContext';
import { User } from '@/types/userType';
import { useToastContext } from '@/context/ToastContext';
import { useProfileFeedback } from './useProfileFeedback';

interface UseProfileCoreProps {
  user?: User | null;
}

interface FeedbackData {
  category: string;
  content: string;
  title: string;
}

export type UseProfileCoreReturn = {
  user: User | null;
  isLoading: boolean;
  activeTab: string;
  isCompactLayout: boolean;
  isMobile: boolean;
  isClient: boolean;
  setActiveTab: (tab: string) => void;
  setIsCompactLayout: (isCompact: boolean) => void;
  handleLogout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  settings: any;
  handleSettingChange: (key: string, value: any) => void;
  feedback: FeedbackData;
  setFeedback: (feedback: FeedbackData) => void;
  handleSubmitFeedback: () => Promise<void>;
  isSubmitting: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  errorMessage: string;
  attachments: File[];
  setAttachments: React.Dispatch<React.SetStateAction<File[]>>;
};

export const useProfileCore = ({ user = null }: UseProfileCoreProps = {}): UseProfileCoreReturn => {
  const { user: authUser, updateUser, logoutUser } = useAuthContext();
  const router = useRouter();
  const currentUser = user || authUser;
  const { showToast } = useToastContext();

  // State
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [feedback, setFeedback] = useState<FeedbackData>({
    category: '',
    content: '',
    title: ''
  });

  // 修改 settings 和 handleSettingChange 的實現
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'zh-TW',
    viewMode: 'grid',
    autoSummarize: false
  });

  const handleSettingChange = useCallback((key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // 初始化載入效果
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  // 檢查用戶登入狀態
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const storedUser = localStorage.getItem("user");
  }, [authUser, router, isClient]);

  // 響應式布局處理
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 登出處理
  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push('/auth/login');
    } catch (error) {
      showToast('登出時發生錯誤', 'error');
      console.error('Logout error:', error);
    }
  };

  // 使用 useProfileFeedback hook 時傳入 attachments
  const feedbackHook = useProfileFeedback({ 
    user: currentUser,
    initialAttachments: attachments
  });

  // 修改 handleSubmitFeedback 函數
  const handleSubmitFeedback = async () => {
    console.log('開始提交反饋:', { feedback, attachments });
    if (!feedback.category || !feedback.content) {
      showToast('請填寫必要欄位', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // 直接使用 feedbackHook 的方法提交，包含當前的 feedback 和 attachments
      await feedbackHook.handleSubmitFeedback({
        title: feedback.title,
        content: feedback.content,
        category: feedback.category,
        attachments: attachments
      });
      
      // 重置表單
      setFeedback({
        category: '',
        content: '',
        title: ''
      });
      setAttachments([]);
      
      showToast('反饋提交成功', 'success');
    } catch (error) {
      console.error('Feedback submission error:', error);
      showToast('提交反饋時發生錯誤', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      showToast('更新成功', 'success');
    } catch (error) {
      showToast('更新失敗', 'error');
      setErrorMessage('更新資料時發生錯誤');
      console.error('Update error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    user: currentUser,
    isLoading,
    activeTab,
    isCompactLayout,
    isMobile,
    isClient,
    setActiveTab,
    setIsCompactLayout,
    handleLogout,
    updateUser,
    settings,
    handleSettingChange,
    feedback,
    setFeedback,
    handleSubmitFeedback,
    isSubmitting,
    handleSubmit,
    errorMessage,
    attachments,
    setAttachments,
  };
}; 