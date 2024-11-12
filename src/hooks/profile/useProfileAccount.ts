import { useState, useCallback } from 'react';

interface UseProfileAccountReturn {
  isLoading: boolean;
  error: string | null;
  accountStatus: 'active' | 'suspended' | 'deactivated';
  accountInfo: {
    email: string;
    username: string;
    joinDate: string;
    lastLogin: string;
    twoFactorEnabled: boolean;
  };
  handleStatusChange: (newStatus: 'active' | 'suspended' | 'deactivated') => Promise<void>;
  handleAccountDeactivation: () => Promise<void>;
  handleAccountDeletion: () => Promise<void>;
  toggleTwoFactor: () => Promise<void>;
  isDeactivating: boolean;
  isDeleting: boolean;
}

export const useProfileAccount = (user: any): UseProfileAccountReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<'active' | 'suspended' | 'deactivated'>('active');
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [accountInfo, setAccountInfo] = useState({
    email: user?.email || '',
    username: user?.username || '',
    joinDate: user?.registrationDate || '',
    lastLogin: new Date().toISOString(),
    twoFactorEnabled: false
  });

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

  const handleAccountDeletion = async () => {
    try {
      setIsDeleting(true);
      // 實作帳號刪除的 API 呼叫
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      setError('帳號刪除失敗');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleTwoFactor = async () => {
    try {
      setIsLoading(true);
      // 實作雙重認證開關的 API 呼叫
      setAccountInfo(prev => ({
        ...prev,
        twoFactorEnabled: !prev.twoFactorEnabled
      }));
    } catch (err) {
      setError('雙重認證設定失敗');
    } finally {
      setIsLoading(false);
    }
  };

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
    isDeleting
  };
}; 