import { useState } from 'react';
import { useRouter } from 'next/router';
import { userApi } from '@/api/user';
import { useToastContext } from '@/context/ToastContext';
import { API_ENDPOINTS } from '@/config/constants';
import { logger } from '@/utils/logger';

interface UseProfileAccountProps {
  user: {
    id?: string;
    userId?: string;
    email?: string;
    username?: string;
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
    try {
      setIsDeleting(true);
      setError(null);

      const response = await fetch(API_ENDPOINTS.DELETE_ACCOUNT, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.userId || user.id || '',
          'x-user-email': user.email || ''
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '刪除帳號失敗');
      }
    } catch (error) {
      logger.error('刪除帳號失敗:', error);
      throw error;
    }
  };

  return {
    password,
    setPassword,
    isDeleting,
    isLoading,
    error,
    passwordError,
    handleAccountDeletion
  };
}; 