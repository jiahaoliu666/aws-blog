// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useToastContext } from '@/context/ToastContext';
import { useAuthContext } from '@/context/AuthContext';
import { logger } from '@/utils/logger';

export function useAuth() {
  const { user, registerUser, logoutUser, error, clearError } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const { showToast } = useToastContext();

  // 檢查用戶認證狀態
  useEffect(() => {
    const checkAuthState = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const isLoggedOut = sessionStorage.getItem('isLoggedOut') === 'true';
        const logoutTimestamp = sessionStorage.getItem('logoutTimestamp');

        // 如果有登出標記且登出時間在30分鐘內，保持登出狀態
        if (isLoggedOut && logoutTimestamp) {
          const thirtyMinutes = 30 * 60 * 1000;
          if (Date.now() - parseInt(logoutTimestamp) < thirtyMinutes) {
            return;
          }
        }

        // 如果 localStorage 中有用戶數據但當前狀態為未登錄，嘗試恢復用戶狀態
        if (storedUser && !user) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.accessToken) {
            // 使用用戶的 email 和 username 作為參數
            registerUser(parsedUser.email, parsedUser.accessToken, parsedUser.username);
          }
        }
      } catch (error) {
        logger.error('檢查認證狀態時發生錯誤:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthState();
  }, [user, registerUser]);

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

  const logout = async () => {
    try {
      setIsLoading(true);
      const success = await logoutUser();
      
      if (success) {
        // 清除所有本地存儲
        localStorage.clear();
        sessionStorage.clear();
        
        // 設置登出標記
        sessionStorage.setItem('isLoggedOut', 'true');
        sessionStorage.setItem('logoutTimestamp', Date.now().toString());
        
        // 觸發登出事件
        window.dispatchEvent(new Event('logout'));
        
        showToast('登出成功', 'success');
        
        // 重導向到登入頁面
        router.push('/auth/login');
      } else {
        showToast('登出失敗，請稍後再試', 'error');
      }
    } catch (error) {
      showToast('登出時發生錯誤', 'error');
      logger.error('登出失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    user, 
    registerUser, 
    login, 
    logout, 
    error, 
    clearError, 
    isLoading,
    isCheckingAuth 
  };
}
