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

  // 新增初始化函數來獲取資料表中的設定
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      console.log('開始獲取通知設定，userId:', userId);
      
      // 確保 userId 存在
      if (!userId) {
        throw new Error('缺少用戶 ID');
      }

      const response = await fetch(`/api/profile/notification-settings/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          // 添加授權標頭（如果需要）
          // 'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('API 響應狀態:', response.status);
      
      if (!response.ok) {
        console.error('獲取設定失敗:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('錯誤詳情:', errorText);
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
      console.log('從資料表獲取的原始數據:', data);
      
      // 驗證數據格式
      if (!data || typeof data.emailNotification === 'undefined') {
        console.error('無效的數據格式:', data);
        throw new Error('獲取到的數據格式無效');
      }
      
      const newSettings = {
        emailNotification: Boolean(data.emailNotification),
        lineNotification: Boolean(data.lineNotification),
        lineUserId: data.lineUserId || undefined
      };
      
      console.log('處理後的設定:', newSettings);
      
      setSettings(newSettings);
      setOriginalSettings(newSettings);
      
    } catch (error) {
      console.error('獲取設定時發生錯誤:', error);
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        showToast('網路連接問題，請檢查網路後重試', 'error');
      } else {
        showToast(
          error instanceof Error ? error.message : '無法載入通知設定，請稍後再試',
          'error'
        );
      }
      
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

  // 在組件掛載時獲取設定
  useEffect(() => {
    if (userId) {
      fetchSettings();
    }
  }, [userId]);

  const hasChanges = useMemo(() => {
    return settings.emailNotification !== originalSettings.emailNotification ||
           settings.lineNotification !== originalSettings.lineNotification;
  }, [settings, originalSettings]);

  const handleSettingChange = useCallback((key: 'emailNotification' | 'lineNotification', value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      console.log('開始保存設定，當前設定:', settings);
      
      if (!userId) {
        throw new Error('缺少用戶 ID');
      }

      // 修改：簡化要保存的設定數據結構
      const settingsToSave = {
        userId, // 添加 userId
        emailNotification: Boolean(settings.emailNotification),
        lineNotification: Boolean(settings.lineNotification),
        lineUserId: settings.lineUserId || null, // 使用 null 而不是 undefined
      };

      console.log('準備發送到資料表的設定:', settingsToSave);

      const response = await fetch('/api/profile/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsToSave) // 直接發送簡化後的設定對象
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
        emailNotification: Boolean(updatedSettings.emailNotification),
        lineNotification: Boolean(updatedSettings.lineNotification),
        lineUserId: updatedSettings.lineUserId || undefined
      };

      setOriginalSettings(normalizedSettings);
      setSettings(normalizedSettings);
      
      console.log('設定已成功更新到本地狀態');
      return true;
      
    } catch (error) {
      console.error('保存設定時發生錯誤:', error);
      // 修改：添加更具體的錯誤處理
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