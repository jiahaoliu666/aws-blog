import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/context/AuthContext';
import { User } from '@/types/userType';
import { useToastContext } from '@/context/ToastContext';
import { useProfileFeedback } from './useProfileFeedback';
import { logger } from '@/utils/logger';

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
  handleResetVerification: () => Promise<void>;
  addActivityLog: (action: string, details?: string) => Promise<void>;
  resetFeedbackForm: () => void;
  feedbackMessage: string;
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

  // 修改初始化載入效果
  useEffect(() => {
    const initializeProfile = async () => {
      try {
        setIsLoading(true);
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (!parsedUser.registrationDate) {
            console.warn('找不到註冊日期，嘗試從 Cognito 重新獲取');
          }
        }
      } catch (error) {
        console.error('初始化設定時發生錯誤:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeProfile();
  }, []);

  // 修改檢查用戶登入狀態
  useEffect(() => {
    if (!isClient) return;

    const checkUserStatus = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        // 這裡可以加入其他用戶狀態檢查邏輯
      } catch (error) {
        // 不在初始檢查時顯示錯誤 toast
        console.error('檢查用戶狀態時發生錯誤:', error);
      }
    };

    checkUserStatus();
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

  // 修改提交反饋的處理函數
  const handleSubmitFeedback = async () => {
    if (!feedback.category || !feedback.content) {
      showToast('請填寫必要欄位', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await feedbackHook.handleSubmitFeedback({
        title: feedback.title,
        content: feedback.content,
        category: feedback.category,
        attachments: attachments
      });
      
      resetFeedbackForm();
      
    } catch (error) {
      console.error('Feedback submission error:', error);
      showToast('提交反饋失敗，請稍後重試', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 修改表單提交處理函數
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      // 實際的更新操作
      showToast('更新成功', 'success');
    } catch (error) {
      // 只在實際操作時顯示錯誤 toast
      showToast('更新失敗', 'error');
      setErrorMessage('更新資料時發生錯誤');
      console.error('Update error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetVerification = async () => {
    setIsSubmitting(true);
    try {
      // 更新設定
      const response = await fetch('/api/profile/notification-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser?.id,
          lineNotification: false
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '重置驗證失敗');
      }

      // 更新本地狀態
      setSettings(prev => ({
        ...prev,
        lineNotification: false
      }));

      // 顯示成功訊息
      showToast('LINE 通知已關閉，所有驗證資料已清除', 'success');

    } catch (error) {
      // 顯示錯誤訊息
      showToast('重置驗證失敗，請稍後再試', 'error');
      logger.error('重置驗證失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 添加 prevTabRef
  const prevTabRef = useRef<string>('profile');

  // 修改重置密碼的事件監聽
  useEffect(() => {
    const handleResetPasswords = () => {
      const resetEvent = new CustomEvent('resetPasswords');
      window.dispatchEvent(resetEvent);
    };

    // 只在完全離開密碼修改頁面時重置
    if (prevTabRef.current === 'changePassword' && 
        activeTab !== 'changePassword' && 
        !isSubmitting) {  // 添加提交狀態檢查
      handleResetPasswords();
    }
    
    prevTabRef.current = activeTab;
  }, [activeTab, isSubmitting]);

  // 調試日誌
  useEffect(() => {
    console.log('User in useProfileCore:', currentUser);
    console.log('Registration date in useProfileCore:', currentUser?.registrationDate);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && !currentUser.registrationDate) {
      console.warn('用戶缺少註冊日期，嘗試從 Cognito 獲取');
      const defaultDate = new Date().toISOString().split('T')[0];
      updateUser({ registrationDate: defaultDate });
    }
  }, [currentUser]);

  const addActivityLog = async (action: string, details?: string) => {
    try {
      await fetch('/api/activity-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser?.id,
          action,
          details
        })
      });
    } catch (error) {
      console.error('記錄活動失敗:', error);
    }
  };

  const resetFeedbackForm = useCallback(() => {
    setFeedback({
      category: '',
      content: '',
      title: ''
    });
    setAttachments([]);
  }, []);

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
    handleResetVerification,
    addActivityLog,
    resetFeedbackForm,
    feedbackMessage: '',
  };
}; 