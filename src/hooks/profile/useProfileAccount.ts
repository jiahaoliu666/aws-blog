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

  const handleAccountDeletion = async (password: string) => {
    if (!user?.sub || !user?.userId || !user?.email) {
      setError('用戶資訊不完整');
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      const response = await userApi.deleteAccount({
        password,
        user: {
          sub: user.sub,
          userId: user.userId,
          email: user.email
        }
      });
      
      if (response.status === 200) {
        showToast('帳號已成功刪除', 'success');
        router.push('/auth/login');
      }
    } catch (error) {
      setIsDeleting(false);
      if (error instanceof Error) {
        switch (error.message) {
          case '密碼錯誤，請重新輸入':
            setError('密碼錯誤，請重新輸入');
            showToast('密碼錯誤，請重新輸入', 'error');
            break;
          case '找不到用戶資料':
            setError('找不到用戶資料');
            showToast('找不到用戶資料', 'error');
            break;
          case '請求過於頻繁，請稍後再試':
            setError('請求過於頻繁，請稍後再試');
            showToast('請求過於頻繁，請稍後再試', 'warning');
            break;
          default:
            setError('刪除帳號失敗，請稍後重試');
            showToast('刪除帳號失敗，請稍後重試', 'error');
        }
      }
      throw error;
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