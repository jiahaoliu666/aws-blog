// src/hooks/useAuth.ts
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useToastContext } from '@/context/ToastContext';
import { useAuthContext } from '@/context/AuthContext';
import { logger } from '@/utils/logger';

export function useAuth() {
  const { user, registerUser, logoutUser, error, clearError } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToastContext();

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (response?.ok) {
        localStorage.setItem('userEmail', email);
        router.push('/');
        showToast('登入成功', 'success');
      } else {
        showToast('登入失敗，請檢查您的帳號密碼', 'error');
      }
    } catch (error) {
      showToast('登入時發生錯誤', 'error');
      logger.error('登入失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { user, registerUser, login, logoutUser, error, clearError, isLoading };
}
