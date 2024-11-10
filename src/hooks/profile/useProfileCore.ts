import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/context/AuthContext';
import { User } from '@/types/userType';
import { useToastContext } from '@/context/ToastContext';

interface UseProfileCoreProps {
  user?: User | null;
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
  feedback: string;
  setFeedback: (feedback: string) => void;
  handleSubmitFeedback: (feedback: string) => void;
  isSubmitting: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  errorMessage: string;
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
  const feedback = '';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

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
    if (!storedUser && !authUser) {
      router.push('/auth/login');
      return;
    }
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

  // 定義 getSettingsFromSomewhere 函數
  const getSettingsFromSomewhere = (): any => {
    // 在這裡返回一些設定
    return {};
  };

  const settings = getSettingsFromSomewhere();

  const handleSettingChange = (key: string, value: any) => {
    // 在這裡實現設置更改的邏輯
  };

  const setFeedback = (feedback: string) => {
    // 定義 setFeedback 的邏輯
  };

  const handleSubmitFeedback = (feedback: string) => {
    // 在這裡實現提交反饋的邏輯
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      // 實作提交邏輯
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
  };
}; 