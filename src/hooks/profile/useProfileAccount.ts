import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/context/AuthContext';
import { api } from '@/api/user'; // 假設這是你的 API 客戶端
import { useToastContext } from '@/context/ToastContext';

interface UseProfileAccountReturn {
  isLoading: boolean;
  error: string | null;
  accountStatus: 'active' | 'suspended' | 'deactivated';
  accountInfo: {
    email: string;
    username: string;
    joinDate: string;
    twoFactorEnabled: boolean;
  };
  handleStatusChange: (newStatus: 'active' | 'suspended' | 'deactivated') => Promise<void>;
  handleAccountDeactivation: () => Promise<void>;
  handleAccountDeletion: (password: string) => Promise<void>;
  toggleTwoFactor: () => Promise<void>;
  isDeactivating: boolean;
  isDeleting: boolean;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  passwordError: string | null;
}

export const useProfileAccount = (user: any): UseProfileAccountReturn => {
  const router = useRouter();
  const { logoutUser } = useAuthContext();
  const { showToast } = useToastContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<'active' | 'suspended' | 'deactivated'>('active');
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const accountInfo = {
    email: user?.email || '',
    username: user?.username || '',
    joinDate: user?.registrationDate || new Date().toISOString().split('T')[0],
    twoFactorEnabled: false
  };

  const handleStatusChange = async (newStatus: 'active' | 'suspended' | 'deactivated') => {
    try {
      setIsLoading(true);
      // 實作狀態變更的 API 呼叫
      setAccountStatus(newStatus);
      showToast('狀態更新成功', 'success');
    } catch (err) {
      showToast('狀態更新失敗', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountDeactivation = async () => {
    try {
      setIsDeactivating(true);
      // 實作帳號停用的 API 呼叫
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAccountStatus('deactivated');
      showToast('帳號已成功停用', 'success');
    } catch (err) {
      showToast('帳號停用失敗', 'error');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleAccountDeletion = async (password: string) => {
    try {
      setIsDeleting(true);
      setError(null);
      setPasswordError(null);

      if (!password) {
        showToast('請輸入密碼以確認刪除', 'error');
        return;
      }

      await api.deleteAccount(password);
      showToast('帳號已成功刪除', 'success');
      await logoutUser();
      router.push('/');
    } catch (err: any) {
      if (err.response?.status === 401) {
        showToast('密碼錯誤，請確認後重試', 'error');
      } else if (err.response?.status === 429) {
        showToast('操作過於頻繁，請等待 5 分鐘後再試', 'error');
      } else if (err.response?.status === 403) {
        showToast('您沒有權限執行此操作，請聯繫管理員', 'error');
      } else if (err.response?.status === 400) {
        showToast('請求格式錯誤，請確認輸入資料是否正確', 'error');
      } else if (err.response?.status >= 500) {
        showToast('系統發生錯誤，請稍後再試或聯繫客服人員', 'error');
      } else {
        showToast('無法刪除帳號，請確認網路連線後重試', 'error');
      }
      console.error('刪除帳號失敗:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleTwoFactor = async () => {
    try {
      setIsLoading(true);
      // 實作雙重認證開關的 API 呼叫
      accountInfo.twoFactorEnabled = !accountInfo.twoFactorEnabled;
      showToast('雙重認證設定已更新', 'success');
    } catch (err) {
      showToast('雙重認證設定失敗', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange: React.Dispatch<React.SetStateAction<string>> = useCallback((value) => {
    if (typeof value === 'function') {
      setPassword(value);
    } else {
      setPassword(value);
    }
  }, []);

  return {
    isLoading,
    error,
    accountStatus,
    accountInfo,
    handleStatusChange,
    handleAccountDeactivation,
    handleAccountDeletion,
    toggleTwoFactor,
    isDeactivating,
    isDeleting,
    password,
    setPassword: handlePasswordChange,
    passwordError,
  };
}; 