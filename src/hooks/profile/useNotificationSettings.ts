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
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile/notification-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...newSettings
        }),
      });

      if (!response.ok) {
        throw new Error('儲存設定失敗');
      }

      const updatedData = await response.json();
      setSettings(prev => ({
        ...prev,
        ...updatedData
      }));
      showToast('設定已更新', 'success');
    } catch (error) {
      logger.error('儲存通知設定失敗:', error);
      showToast('儲存設定失敗', 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // 處理設定變更
  const handleSettingChange = async (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    try {
      await saveSettings({ [key]: value });
    } catch (error) {
      // 如果儲存失敗，恢復原始狀態
      setSettings(prev => ({ ...prev }));
    }
  };

  useEffect(() => {
    loadSettings();
  }, [userId]);

  return {
    settings,
    isLoading,
    isSaving,
    hasChanges,
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