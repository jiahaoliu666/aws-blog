import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/context/AuthContext';
import { api } from '@/api/user'; 
import { useToastContext } from '@/context/ToastContext';
import { logger } from '@/utils/logger';

export const useProfileAccount = (user: any) => {
  const router = useRouter();
  const { logoutUser } = useAuthContext();
  const { showToast } = useToastContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // 取得用戶基本資訊
  const accountInfo = {
    email: user?.email || '',
    username: user?.username || '',
    joinDate: user?.registrationDate || new Date().toISOString()
  };

  const handleAccountDeletion = async (password: string) => {
    try {
      setIsDeleting(true);
      setError(null);
      setPasswordError(null);

      if (!password) {
        logger.warn('未提供密碼');
        showToast('請輸入密碼以確認刪除', 'error');
        return;
      }

      logger.info('開始刪除帳戶流程');

      // 檢查用戶資訊
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        logger.error('本地儲存中未找到用戶資訊');
        throw new Error('請重新登入後再試');
      }

      const user = JSON.parse(userStr);
      logger.info('用戶資訊檢查:', {
        hasEmail: !!user.email,
        hasAccessToken: !!user.accessToken
      });

      try {
        const response = await api.deleteAccount(password);
        logger.info('刪除帳戶 API 響應:', { success: response.success });

        if (response.success) {
          showToast('帳號已成功刪除', 'success');
          // 確保清理本地資料
          localStorage.clear();
          await logoutUser();
          router.push('/');
        } else {
          throw new Error(response.message || '刪除帳號失敗');
        }
      } catch (apiError: any) {
        logger.error('API 調用失敗:', {
          error: apiError.message,
          status: apiError.response?.status,
          data: apiError.response?.data
        });
        throw apiError;
      }
    } catch (err: any) {
      logger.error('刪除帳戶處理失敗:', {
        error: err.message,
        name: err.name,
        status: err.response?.status
      });

      // 根據錯誤類型顯示適當的錯誤訊息
      if (err.message.includes('密碼錯誤')) {
        setPasswordError('請輸入正確的密碼');
        showToast('請輸入正確的密碼', 'error');
      } else if (err.message.includes('伺服器處理請求時發生錯誤')) {
        setError('系統暫時無法處理您的請求，請稍後重試');
        showToast('系統暫時無法處理您的請求，請稍後重試', 'error');
      } else if (err.message.includes('未授權')) {
        setPasswordError('密碼錯誤或未授權，請確認後重試');
        showToast('密碼錯誤或未授權，請確認後重試', 'error');
      } else {
        setError(err.message || '刪除帳號失敗，請稍後重試');
        showToast(err.message || '刪除帳號失敗，請稍後重試', 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isLoading,
    error,
    accountInfo,
    handleAccountDeletion,
    isDeleting,
    password,
    setPassword,
    passwordError,
    accountStatus: 'active',
  };
}; 