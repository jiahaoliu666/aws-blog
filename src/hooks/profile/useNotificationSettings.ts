import { useState, useEffect } from 'react';
import { NotificationSettings } from '@/types/profileTypes';
import { logger } from '@/utils/logger';

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: false,
    line: false,
    browser: false,
    mobile: false,
    all: false
  });
  const [tempSettings, setTempSettings] = useState<NotificationSettings>({
    email: false,
    line: false,
    browser: false,
    mobile: false,
    all: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/profile/notification-settings');
        
        if (!response.ok) {
          throw new Error('獲取通知設定失敗');
        }
        
        const data = await response.json();
        const newSettings = {
          email: data.email ?? false,
          line: data.line ?? false,
          browser: data.browser ?? false,
          mobile: data.mobile ?? false,
          all: data.all ?? false
        };
        setSettings(newSettings);
        setTempSettings(newSettings);
      } catch (err) {
        logger.error('獲取通知設定失敗:', err);
        setError(err instanceof Error ? err : new Error('未知錯誤'));
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleToggle = (type: keyof NotificationSettings) => {
    setTempSettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const saveSettings = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          settings: tempSettings
        }),
      });

      if (!response.ok) {
        throw new Error('更新通知設定失敗');
      }

      const data = await response.json();
      setSettings(tempSettings);
      return data;
    } catch (err) {
      logger.error('儲存通知設定失敗:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    tempSettings,
    loading,
    error,
    handleToggle,
    saveSettings
  };
};
