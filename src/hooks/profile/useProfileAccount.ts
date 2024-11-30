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
    if (!password.trim()) {
      showToast('請輸入密碼以確認刪除', 'error');
      return;
    }

    try {
      setIsDeleting(true);
      showToast('正在處理您的請求...', 'loading');

      await userApi.deleteAccount(password);
      showToast('帳號已成功刪除', 'success');
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      showToast(errorMessage, 'error');
      setError(errorMessage);
    } finally {
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