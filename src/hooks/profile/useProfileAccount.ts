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
    if (!user?.sub || !user?.userId) {
      showToast('缺少必要的用戶資訊', 'error');
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      const response = await userApi.deleteAccount({
        password,
        userId: user.userId,
        userSub: user.sub
      });

      if (response.status === 200) {
        showToast('帳號已成功刪除', 'success');
        setTimeout(() => {
          router.push('/auth/login');
        }, 1500);
      }
    } catch (error) {
      let errorMessage = '刪除帳號時發生錯誤';
      
      if (error instanceof Error) {
        if (error.message.includes('密碼錯誤') || error.message.includes('密碼驗證失敗')) {
          errorMessage = '密碼錯誤，請重新輸入';
        } else if (error.message.includes('用戶不存在')) {
          errorMessage = '找不到用戶資料';
        }
      }
      
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