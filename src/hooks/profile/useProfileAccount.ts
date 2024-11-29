import { useState } from 'react';
import { useRouter } from 'next/router';
import { useToastContext } from '@/context/ToastContext';
import { API_ENDPOINTS } from '@/config/constants';
import { logger } from '@/utils/logger';

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
    if (!user?.userId) {
      showToast('找不到用戶資料', 'error');
      return;
    }

    try {
      setIsDeleting(true);
      logger.info('開始刪除帳號流程:', { 
        userId: user.sub,
        email: user.email 
      });

      const response = await fetch(API_ENDPOINTS.DELETE_ACCOUNT, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.sub || '',
          'x-user-email': user.email || ''
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('刪除帳號請求失敗:', {
          status: response.status,
          message: data.message,
          userId: user.sub
        });
        throw new Error(data.message || '刪除帳號失敗');
      }

      showToast('帳號已成功刪除', 'success');
      router.push('/auth/login');
    } catch (error) {
      logger.error('刪除帳號失敗:', error);
      const errorMessage = error instanceof Error ? error.message : '刪除帳號失敗，請稍後重試';
      showToast(errorMessage, 'error');
      throw error;
    } finally {
      setIsDeleting(false);
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