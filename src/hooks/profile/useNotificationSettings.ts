import { useState, useCallback, useMemo } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { lineService } from '@/services/lineService';
import { useToastContext } from '@/context/ToastContext';

export const useNotificationSettings = (userId: string) => {
  const { user } = useAuthContext();
  const { showToast } = useToastContext();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    emailNotification: false,
    lineNotification: false
  });
  const [originalSettings, setOriginalSettings] = useState({
    emailNotification: false,
    lineNotification: false
  });

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
      // 更新 DynamoDB 中的設定
      const response = await fetch('/api/profile/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          settings: {
            email: settings.emailNotification,
            line: settings.lineNotification
          }
        })
      });

      if (!response.ok) {
        throw new Error('儲存設定失敗');
      }

      // 更新本地狀態
      setOriginalSettings(settings);
      showToast('設定已更新', 'success');
    } catch (error) {
      console.error('儲存設定時發生錯誤:', error);
      showToast('儲存設定失敗', 'error');
      throw error;
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