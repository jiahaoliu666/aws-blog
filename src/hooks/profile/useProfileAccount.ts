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
    if (!password) {
      setError('請輸入密碼');
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      await userApi.deleteAccount(password);
      
      showToast('帳號已成功刪除', 'success');
      await router.push('/auth/login');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      setIsDeleting(false);
    }
  };

  return {
    password,
    setPassword,
    isDeleting,
    error,
    handleAccountDeletion
  };
}; 