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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchNotificationSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/profile/notification-settings');
        
        if (!response.ok) {
          throw new Error('獲取通知設定失敗');
        }
        
        const data = await response.json();
        setSettings({
          email: data.email ?? false,
          line: data.line ?? false,
          browser: data.browser ?? false,
          mobile: data.mobile ?? false,
          all: data.all ?? false
        });
        logger.info('成功獲取通知設定:', data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('未知錯誤');
        logger.error('獲取通知設定失敗:', error);
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationSettings();
  }, []);

  const updateSettings = async (userId: string, newSettings: Partial<NotificationSettings>) => {
    try {
      setLoading(true);
      logger.info('開始更新通知設定:', { userId, newSettings });

      const response = await fetch('/api/profile/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          settings: newSettings
        }),
      });

      if (!response.ok) {
        throw new Error('更新通知設定失敗');
      }

      const data = await response.json();
      setSettings(data);
      logger.info('成功更新通知設定:', data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('更新設定時發生錯誤');
      logger.error('更新通知設定失敗:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
  };
};
