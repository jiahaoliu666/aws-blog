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
    try {
      setIsDeleting(true);
      setError(null);

      if (!user?.sub) {
        throw new Error('找不到用戶識別碼');
      }

      await userApi.deleteAccount({
        user: {
          sub: user.sub,
          userId: user.userId || user.id,
          email: user.email,
        },
        password
      });

      showToast('帳號已成功刪除', 'success');
      router.push('/auth/login');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '刪除帳號失敗';
      showToast(errorMessage, 'error');
      setError(errorMessage);
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