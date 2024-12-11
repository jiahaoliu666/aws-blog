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
    if (!user?.sub || !password) {
      setError('缺少必要的用戶資訊或密碼');
      return;
    }

    try {
      setIsDeleting(true);
      
      const response = await fetch(API_ENDPOINTS.DELETE_ACCOUNT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userSub: user.sub,
          userId: user.userId,
          password
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '刪除帳號失敗');
      }

      showToast('帳號已成功刪除', 'success');
      router.push('/auth/login');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '刪除帳號失敗';
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