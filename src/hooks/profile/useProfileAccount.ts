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
    } catch (err) {
      setError('狀態更新失敗');
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
    } catch (err) {
      setError('帳號停用失敗');
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
        setPasswordError('請輸入密碼以確認刪除');
        return;
      }

      await api.deleteAccount(password);
      
      showToast('帳號已成功刪除', 'success');
      await logoutUser();
      router.push('/');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setPasswordError('密碼錯誤，請重試');
      } else if (err.response?.status === 429) {
        setError('請求過於頻繁，請稍後再試');
      } else {
        setError('帳號刪除失敗，請稍後重試');
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
    } catch (err) {
      setError('雙重認證設定失敗');
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