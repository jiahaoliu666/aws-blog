import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/context/AuthContext';
import { api } from '@/api/user'; 
import { useToastContext } from '@/context/ToastContext';

interface UseProfileAccountReturn {
  isLoading: boolean;
  error: string | null;
  accountStatus: 'active' | 'suspended' | 'deactivated';
  accountInfo: {
    email: string;
    username: string;
    joinDate: string;
  };
  handleAccountDeletion: (password: string) => Promise<void>;
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  const accountInfo = {
    email: user?.email || '',
    username: user?.username || '',
    joinDate: user?.registrationDate || new Date().toISOString().split('T')[0],
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

      const response = await api.deleteAccount(password);
      
      if (response.success) {
        showToast('帳號已成功刪除', 'success');
        await logoutUser();
        router.push('/');
      } else {
        throw new Error(response.message || '刪除帳號失敗');
      }
    } catch (err: any) {
      console.error('刪除帳號錯誤:', err);
      
      if (err.response?.status === 401) {
        setPasswordError('密碼錯誤，請確認後重試');
        showToast('密碼錯誤，請確認後重試', 'error');
      } else if (err.response?.status === 429) {
        showToast('操作過於頻繁，請等待 5 分鐘後再試', 'error');
      } else {
        showToast(err.message || '刪除帳號失敗，請稍後重試', 'error');
      }
    } finally {
      setIsDeleting(false);
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
    handleAccountDeletion,
    isDeleting,
    password,
    setPassword: handlePasswordChange,
    passwordError,
  };
}; 