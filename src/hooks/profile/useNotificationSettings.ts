import { useState, useEffect } from 'react';
import { NotificationSettings } from '@/types/profileTypes';
import { logger } from '@/utils/logger';

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<Pick<NotificationSettings, 'email' | 'line'>>({
    email: false,
    line: false
  });
  const [tempSettings, setTempSettings] = useState<Pick<NotificationSettings, 'email' | 'line'>>({
    email: false,
    line: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

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
          line: data.line ?? false
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

  const handleToggle = (type: 'email' | 'line') => {
    setTempSettings(prev => {
      const newSettings = {
        ...prev,
        [type]: !prev[type]
      };
      setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(settings));
      return newSettings;
    });
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
      setHasChanges(false);
      return data;
    } catch (err) {
      logger.error('儲存通知設定失敗:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    setTempSettings(settings);
    setHasChanges(false);
  };

  return {
    settings,
    tempSettings,
    loading,
    error,
    hasChanges,
    handleToggle,
    saveSettings,
    resetSettings
  };
};
