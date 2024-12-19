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
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useToastContext();

  const handleAccountDeletion = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      if (!user?.sub || !user?.userId || !user?.email) {
        throw new Error('缺少必要的用戶資訊');
      }

      const response = await fetch(API_ENDPOINTS.DELETE_ACCOUNT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          userId: user.userId,
          userSub: user.sub,
          email: user.email,
          username: user.username
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('密碼錯誤，請重新輸入');
        } else {
          setError(data.message || '刪除帳號失敗');
        }
        return;
      }

      // 顯示成功訊息
      showToast('帳號已成功刪除', 'success');

      // 清除本地儲存
      localStorage.clear();
      
      // 等待 toast 顯示完成後再重導向
      setTimeout(() => {
        router.push('/auth/login');
      }, 1500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '刪除帳號時發生錯誤';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      logger.error('刪除帳號失敗:', { error });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetAccountDeletionState = () => {
    setPassword('');
    setError(null);
  };

  return {
    password,
    setPassword,
    isDeleting,
    error,
    setError,
    handleAccountDeletion,
    resetAccountDeletionState
  };
}; 