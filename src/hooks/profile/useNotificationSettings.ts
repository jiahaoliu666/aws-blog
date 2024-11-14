import { useState, useEffect } from 'react';
import { useToastContext } from '@/context/ToastContext';
import { logger } from '@/utils/logger';

interface NotificationSettings {
  emailNotification: boolean;
  lineNotification: boolean;
  lineUserId: string | null;
}

export const useNotificationSettings = (userId: string) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotification: false,
    lineNotification: false,
    lineUserId: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { showToast } = useToastContext();

  // 載入設定
  const loadSettings = async () => {
    try {
      const response = await fetch(`/api/profile/notification-settings/${userId}`);
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      logger.error('載入通知設定失敗:', error);
      showToast('載入設定失敗', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 儲存設定
  const saveSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const response = await fetch('/api/profile/notification-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          emailNotification: newSettings.emailNotification
        })
      });

      if (!response.ok) {
        throw new Error('儲存設定失敗');
      }

      const data = await response.json();
      
      // 更新本地狀態
      setSettings(prevSettings => ({
        ...prevSettings,
        ...data
      }));
      
      return data;
    } catch (error) {
      logger.error('儲存設定失敗:', error);
      throw error;
    }
  };

  // 處理設定變更
  const handleSettingChange = async (key: string, value: any) => {
    if (settings[key as keyof NotificationSettings] !== value) {
      setSettings(prev => ({ ...prev, [key]: value }));
      setHasChanges(true);
      return true;
    }
    return false;
  };

  useEffect(() => {
    loadSettings();
  }, [userId]);

  return {
    settings,
    isLoading,
    isSaving,
    hasChanges,
    setHasChanges,
    handleSettingChange,
    saveSettings,
    reloadSettings: loadSettings,
    handleSendUserId: async () => {
      // 實作發送用戶ID的邏輯
      return true;
    },
    handleVerifyCode: async (code: string) => {
      // 實作驗證碼驗證邏輯
      return true;
    }
  };
};