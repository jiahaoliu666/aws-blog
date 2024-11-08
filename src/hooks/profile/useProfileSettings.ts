import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { User } from '@/types/userType';

interface UseProfileSettingsProps {
  user: User | null;
}

export const useProfileSettings = ({ user }: UseProfileSettingsProps) => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      if (typeof window !== 'undefined') {
        const cachedTimestamp = localStorage.getItem('settingsCacheTimestamp');
        const CACHE_DURATION = 5 * 60 * 1000; // 5分鐘快取
        
        if (cachedTimestamp && Date.now() - Number(cachedTimestamp) < CACHE_DURATION) {
          return;
        }
      }

      const response = await fetch('/api/notifications/settings');
      const data = await response.json();
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('userSettings', JSON.stringify(data));
        localStorage.setItem('settingsCacheTimestamp', Date.now().toString());
      }
      setSettings(data);
    } catch (error) {
      logger.error('獲取設定時發生錯誤:', error);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedSettings = localStorage.getItem('userSettings');
      if (cachedSettings) {
        setSettings(JSON.parse(cachedSettings));
      }
    }
  }, []);

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      // 實作儲存設定的邏輯
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模擬 API 呼叫
      setIsLoading(false);
    } catch (error) {
      logger.error('儲存設定時發生錯誤:', error);
      setIsLoading(false);
    }
  };

  return {
    settings,
    isLoading,
    fetchSettings,
    handleSaveSettings
  };
}; 