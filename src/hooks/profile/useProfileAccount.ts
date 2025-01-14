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
    try {
      setIsDeleting(true);
      setError(null);

      if (!user?.sub || !user?.userId || !user?.email) {
        throw new Error('缺少必要的用戶資訊');
      }

      const response = await fetch(API_ENDPOINTS.DELETE_ACCOUNT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          userId: user.userId,
          userSub: user.sub,
          email: user.email,
          username: user.username
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          showToast('密碼驗證失敗，請確認密碼是否正確', 'error');
          setError('密碼錯誤，請重新輸入');
          return;
        } 
        
        if (response.status === 404) {
          showToast('找不到用戶資料，請聯繫客服支援', 'error');
          setError(data.details || '用戶資料不存在');
          return;
        }
        
        showToast(data.message || '刪除帳號失敗', 'error');
        setError(data.details || '刪除帳號失敗');
        return;
      }

      // 清除所有本地存儲
      clearAllStorages();
      
      // 顯示成功訊息
      showToast('帳號已成功刪除', 'success');
      
      // 等待 toast 顯示完成後再重導向並重整頁面
      setTimeout(() => {
        router.push('/auth/login').then(() => {
          window.location.reload();
        });
      }, 1500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '刪除帳號時發生錯誤';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      logger.error('刪除帳號失敗:', { error });
    } finally {
      setIsDeleting(false);
    }
  };

  // 新增清除所有本地存儲的函數
  const clearAllStorages = () => {
    try {
      logger.info('開始清除所有本地存儲');

      // 1. 清除 localStorage
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          logger.warn(`清除 localStorage key ${key} 失敗:`, e);
        }
      });
      localStorage.clear();
      
      // 2. 清除 sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage);
      sessionStorageKeys.forEach(key => {
        try {
          sessionStorage.removeItem(key);
        } catch (e) {
          logger.warn(`清除 sessionStorage key ${key} 失敗:`, e);
        }
      });
      sessionStorage.clear();
      
      // 3. 清除所有 cookies
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        try {
          const [name] = cookie.trim().split('=');
          if (name) {
            // 使用多個路徑確保完全清除
            const paths = ['/', '/api', '/auth', '/profile'];
            paths.forEach(path => {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
            });
          }
        } catch (e) {
          logger.warn(`清除 cookie ${cookie} 失敗:`, e);
        }
      });

      // 4. 特別處理 next-auth 相關的 cookies
      const nextAuthCookies = [
        'next-auth.session-token',
        'next-auth.csrf-token',
        'next-auth.callback-url',
        'next-auth.state',
        '__Secure-next-auth.session-token',
        '__Host-next-auth.csrf-token'
      ];

      nextAuthCookies.forEach(cookieName => {
        try {
          document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;secure;samesite=lax`;
        } catch (e) {
          logger.warn(`清除 next-auth cookie ${cookieName} 失敗:`, e);
        }
      });

      // 5. 清除 IndexedDB 資料（如果有的話）
      const deleteIndexedDB = async () => {
        try {
          const databases = await window.indexedDB.databases();
          databases.forEach(db => {
            if (db.name) {
              window.indexedDB.deleteDatabase(db.name);
            }
          });
        } catch (e) {
          logger.warn('清除 IndexedDB 失敗:', e);
        }
      };
      deleteIndexedDB().catch(e => logger.warn('執行 IndexedDB 清除失敗:', e));

      logger.info('所有本地存儲清除完成');
    } catch (error) {
      logger.error('清除本地存儲時發生錯誤:', {
        error: error instanceof Error ? error.message : '未知錯誤',
        stack: error instanceof Error ? error.stack : undefined
      });
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