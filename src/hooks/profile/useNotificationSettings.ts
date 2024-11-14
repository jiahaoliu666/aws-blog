import { useState, useEffect } from 'react';
import { useToastContext } from '@/context/ToastContext';
import { logger } from '@/utils/logger';

interface NotificationSettings {
  emailNotification: boolean;
  lineNotification: boolean;
  lineUserId: string | null;
  lineId: string | null;
}

export const useNotificationSettings = (userId: string) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotification: false,
    lineNotification: false,
    lineUserId: null,
    lineId: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { showToast } = useToastContext();
  const [isLineVerified, setIsLineVerified] = useState(false);

  // 載入設定
  const loadSettings = async () => {
    try {
      const response = await fetch(`/api/profile/notification-settings/${userId}`);
      if (!response.ok) {
        console.error('載入設定失敗');
        return;
      }
      
      const data = await response.json();
      console.log('從 API 獲取的設定:', data);
      
      setSettings({
        emailNotification: data.emailNotification || false,
        lineNotification: data.lineNotification || false,
        lineUserId: data.lineUserId || null,
        lineId: data.lineId || null
      });
      
      setIsLineVerified(data.lineNotification || false);
    } catch (error) {
      console.error('載入通知設定失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 儲存設定
  const saveSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      setIsSaving(true);
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
        showToast('儲存設定失敗', 'error');
        throw new Error('儲存設定失敗');
      }

      const data = await response.json();
      setSettings(prevSettings => ({
        ...prevSettings,
        ...data
      }));
      
      showToast('設定已更新', 'success');
      return data;
    } catch (error) {
      logger.error('儲存設定失敗:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // 處理設定變更
  const handleSettingChange = async (key: string, value: any) => {
    try {
      if (settings[key as keyof NotificationSettings] !== value) {
        // 特別處理 LINE 通知關閉的情況
        if (key === 'lineNotification' && !value) {
          const response = await fetch('/api/profile/notification-settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              lineNotification: false,
              emailNotification: settings.emailNotification
            })
          });

          if (!response.ok) {
            throw new Error('更新設定失敗');
          }

          const data = await response.json();
          setSettings(prev => ({
            ...prev,
            lineNotification: false,
            lineUserId: null,
            lineId: null
          }));
          setIsLineVerified(false);
        } else {
          setSettings(prev => ({ ...prev, [key]: value }));
        }
        setHasChanges(true);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('更新設定失敗:', error);
      showToast('更新設定失敗', 'error');
      return false;
    }
  };

  useEffect(() => {
    loadSettings();
  }, [userId]);

  return {
    settings,
    isLineVerified,
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