import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { lineService } from '@/services/lineService';
import { useToastContext } from '@/context/ToastContext';

// 定義對應資料表的介面
interface UserNotificationSettings {
  userId: string;
  emailNotification: boolean;
  lineNotification: boolean;
  lineUserId?: string;
  updatedAt: string;
  createdAt: string;
}

export const useNotificationSettings = (userId: string) => {
  const { user } = useAuthContext();
  const { showToast } = useToastContext();
  const [isLoading, setIsLoading] = useState(false);
  
  // 更新 state 以匹配資料表結構
  const [settings, setSettings] = useState<Partial<UserNotificationSettings>>({
    emailNotification: false,
    lineNotification: false,
    lineUserId: undefined
  });
  
  const [originalSettings, setOriginalSettings] = useState<Partial<UserNotificationSettings>>({
    emailNotification: false,
    lineNotification: false,
    lineUserId: undefined
  });

  // 新增 verificationState
  const [verificationState, setVerificationState] = useState<{
    isVerified: boolean;
  }>({ isVerified: false });

  // 新增初始化函數來獲取資料表中的設定
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      
      // 確保 userId 存在
      if (!userId) {
        throw new Error('缺少用戶 ID');
      }

      const response = await fetch(`/api/profile/notification-settings/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          const defaultSettings = {
            emailNotification: false,
            lineNotification: false,
            lineUserId: undefined
          };
          setSettings(defaultSettings);
          setOriginalSettings(defaultSettings);
          return;
        } else if (response.status === 401) {
          throw new Error('請重新登入');
        } else {
          throw new Error('無法載入通知設定');
        }
      }
      
      const data = await response.json();
      
      const newSettings = {
        emailNotification: Boolean(data.emailNotification),
        lineNotification: Boolean(data.lineNotification),
        lineUserId: data.lineUserId || undefined
      };
      
      setSettings(newSettings);
      setOriginalSettings(newSettings);
      
    } catch (error) {
      console.error('獲取設定時發生錯誤:', error);
      
      const defaultSettings = {
        emailNotification: false,
        lineNotification: false,
        lineUserId: undefined
      };
      setSettings(defaultSettings);
      setOriginalSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = useMemo(() => {
    // 檢查是否有任何設定發生變化
    const hasEmailChanged = settings.emailNotification !== originalSettings.emailNotification;
    const hasLineChanged = settings.lineNotification !== originalSettings.lineNotification;
    
    console.log('設定變更檢查:', {
      原始設定: originalSettings,
      當前設定: settings,
      電子郵件已變更: hasEmailChanged,
      LINE已變更: hasLineChanged
    });
    
    return hasEmailChanged || hasLineChanged;
  }, [settings, originalSettings]);

  const handleSettingChange = useCallback((key: 'emailNotification' | 'lineNotification', value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const saveSettings = async () => {
    try {
      // 檢查是否有變更
      if (!hasChanges) {
        showToast('沒有需要儲存的變更', 'info');
        return false;
      }

      // 移到這裡：檢查 LINE 通知的狀態
      if (settings.lineNotification && !verificationState?.isVerified) {
        showToast('請先完成 LINE 驗證流程', 'warning');
        return false;
      }

      setIsLoading(true);
      console.log('開始保存設定，當前設定:', settings);
      
      if (!userId) {
        throw new Error('缺少用戶 ID');
      }

      const settingsToSave = {
        userId,
        emailNotification: Boolean(settings.emailNotification),
        lineNotification: Boolean(settings.lineNotification),
        lineUserId: settings.lineUserId || null,
      };

      console.log('準備發送到資料表的設定:', settingsToSave);

      const response = await fetch('/api/profile/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsToSave)
      });

      console.log('保存響應狀態:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('保存設定失敗:', response.status, errorText);
        throw new Error('儲存設定失敗');
      }

      const updatedSettings = await response.json();
      console.log('資料表返回的更新後設定:', updatedSettings);
      
      // 更新本地狀態
      const normalizedSettings = {
        emailNotification: Boolean(updatedSettings.data.emailNotification),
        lineNotification: Boolean(updatedSettings.data.lineNotification),
        lineUserId: updatedSettings.data.lineUserId || undefined
      };

      setOriginalSettings(normalizedSettings);
      setSettings(normalizedSettings);
      
      console.log('設定已成功更新到本地狀態');
      showToast('設定已成功儲存', 'success');
      return true;
      
    } catch (error) {
      console.error('保存設定時發生錯誤:', error);
      if (error instanceof Error) {
        showToast(`儲存失敗: ${error.message}`, 'error');
      } else {
        showToast('儲存設定失敗，請稍後再試', 'error');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const reloadSettings = async () => {
    // 重新載入原始設定
    setSettings(originalSettings);
  };

  return {
    settings,
    isLoading,
    hasChanges,
    handleSettingChange,
    saveSettings,
    reloadSettings,
    handleSendUserId: async () => {
      try {
        const response = await fetch('/api/line/send-id', {
          method: 'POST',
          body: JSON.stringify({ userId })
        });
        return response.ok;
      } catch (error) {
        console.error('發送 ID 失敗:', error);
        return false;
      }
    },
    handleVerifyCode: async (code: string) => {
      try {
        const response = await fetch('/api/line/verify-code', {
          method: 'POST',
          body: JSON.stringify({ userId, code })
        });
        return response.ok;
      } catch (error) {
        console.error('驗證碼驗證失敗:', error);
        return false;
      }
    }
  };
};