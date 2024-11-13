import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { logger } from '@/utils/logger';

interface NotificationSettings {
  email: boolean;
  line: boolean;
}

export const useNotificationSettings = (userId: string) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: false,
    line: false
  });
  const [tempSettings, setTempSettings] = useState<NotificationSettings>({
    email: false,
    line: false
  });
  const [loading, setLoading] = useState(false);

  // 初始化載入設定
  useEffect(() => {
    const fetchSettings = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/profile/notification-settings?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error('獲取設定失敗');
        }

        const data = await response.json();
        const newSettings = {
          email: data.email,
          line: data.line
        };
        
        setSettings(newSettings);
        setTempSettings(newSettings);
      } catch (err) {
        logger.error('獲取通知設定失敗:', err);
        toast.error('載入設定失敗，請重新整理頁面');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [userId]);

  // 處理切換設定
  const handleToggle = (type: keyof NotificationSettings) => {
    const newSettings = {
      ...tempSettings,
      [type]: !tempSettings[type]
    };
    setTempSettings(newSettings);
  };

  // 儲存設定
  const saveSettings = async () => {
    if (!userId) {
      toast.error('請先登入');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/profile/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          email: tempSettings.email,
          line: tempSettings.line
        })
      });

      if (!response.ok) {
        throw new Error('儲存設定失敗');
      }

      const data = await response.json();
      setSettings({
        email: data.email,
        line: data.line
      });
      setTempSettings({
        email: data.email,
        line: data.line
      });
      toast.success('通知設定已更新');
    } catch (err) {
      logger.error('儲存通知設定失敗:', err);
      toast.error('儲存設定失敗，請稍後再試');
      setTempSettings(settings);
    } finally {
      setLoading(false);
    }
  };

  // 重置設定
  const resetSettings = () => {
    setTempSettings(settings);
  };

  // 添加 hasChanges 的計算
  const hasChanges = JSON.stringify(tempSettings) !== JSON.stringify(settings);

  return {
    settings: tempSettings,
    originalSettings: settings,
    loading,
    handleToggle,
    saveSettings,
    resetSettings,
    hasChanges
  };
};