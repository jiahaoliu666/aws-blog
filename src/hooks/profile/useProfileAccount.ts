import { useState } from 'react';
import { useRouter } from 'next/router';
import { useToastContext } from '@/context/ToastContext';
import { API_ENDPOINTS } from '@/config/constants';
import { logger } from '@/utils/logger';
import { userApi } from '@/api/user';

interface UseProfileAccountProps {
  user: {
    id?: string;
    userId?: string;
    email?: string;
    username?: string;
    sub?: string;
  };
}

export const useProfileAccount = ({ user }: UseProfileAccountProps) => {
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useToastContext();

  const handleAccountDeletion = async () => {
    try {
      setIsDeleting(true);
      showToast('正在處理帳號刪除請求...', 'loading');

      await userApi.deleteAccount({
        password,
        user: {
          sub: user.sub,
          userId: user.userId,
          email: user.email
        }
      });
      
      showToast('帳號已成功刪除', 'success');
      
      // 延遲 2 秒後重導向到登入頁面
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);

    } catch (error) {
      setIsDeleting(false);
      
      if (error instanceof Error) {
        switch (error.message) {
          case '密碼錯誤':
            showToast('密碼錯誤，請重新輸入', 'error');
            setPasswordError('密碼錯誤');
            break;
          case '用戶不存在':
            showToast('找不到用戶資料', 'error');
            break;
          default:
            showToast('刪除帳號失敗，請稍後重試', 'error');
        }
      } else {
        showToast('發生未知錯誤，請稍後重試', 'error');
      }
      
      setError(error instanceof Error ? error.message : '刪除帳號失敗，請稍後重試');
    }
  };

  return {
    password,
    setPassword,
    isDeleting,
    isLoading,
    error,
    handleAccountDeletion,
    passwordError,
  };
}; 