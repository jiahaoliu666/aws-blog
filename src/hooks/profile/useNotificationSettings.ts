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
  const toast = useToastContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
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
      
      if (!userId) {
        throw new Error('缺少用戶 ID');
      }

      const response = await fetch(`/api/profile/notification-settings/${userId}`);
      
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
        }
        throw new Error(response.status === 401 ? '請重新登入' : '無法載入通知設定');
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
      setSettings({
        emailNotification: false,
        lineNotification: false,
        lineUserId: undefined
      });
      setOriginalSettings({
        emailNotification: false,
        lineNotification: false,
        lineUserId: undefined
      });
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
      if (!hasChanges) return false;

      if (settings.lineNotification && !verificationState?.isVerified) {
        throw new Error('請先完成 LINE 驗證流程');
      }

      setIsSaving(true);
      
      if (!userId) {
        throw new Error('缺少用戶 ID');
      }

      const response = await fetch('/api/profile/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          emailNotification: Boolean(settings.emailNotification),
          lineNotification: Boolean(settings.lineNotification),
          lineUserId: settings.lineUserId || null,
        })
      });

      if (!response.ok) {
        throw new Error('儲存設定失敗');
      }

      const { data: updatedSettings } = await response.json();
      
      const normalizedSettings = {
        emailNotification: Boolean(updatedSettings.emailNotification),
        lineNotification: Boolean(updatedSettings.lineNotification),
        lineUserId: updatedSettings.lineUserId || undefined
      };

      setOriginalSettings(normalizedSettings);
      setSettings(normalizedSettings);
      
      return true;
      
    } catch (error) {
      console.error('保存設定時發生錯誤:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const reloadSettings = async () => {
    // 重新載入原始設定
    setSettings(originalSettings);
  };

  return {
    settings,
    isLoading,
    isSaving,
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