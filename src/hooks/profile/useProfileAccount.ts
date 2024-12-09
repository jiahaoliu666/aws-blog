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
  const { showToast } = useToastContext();
  const router = useRouter();

  const handleAccountDeletion = async () => {
    try {
      setIsDeleting(true);
      
      // 確保有所有必要參數
      if (!user?.userId || !user?.sub || !password) {
        throw new Error('缺少必要參數：請確保已提供用戶ID、sub和密碼');
      }

      const response = await fetch('/api/profile/account/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password,
          userId: user.userId,
          userSub: user.sub
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || '刪除帳號時發生錯誤');
      }

      showToast('帳號已成功刪除', 'success');
      router.push('/auth/login');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      setError(errorMessage);
      showToast(errorMessage, 'error');
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