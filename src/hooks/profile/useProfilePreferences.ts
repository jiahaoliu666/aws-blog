import { useState, useCallback } from 'react';
import { useToast } from '../toast/useToast';

interface PreferenceSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
}

export type UseProfilePreferencesReturn = {
  preferences: PreferenceSettings;
  updatePreferences: (newSettings: PreferenceSettings) => Promise<void>;
  isLoading: boolean;
};

export const useProfilePreferences = (): UseProfilePreferencesReturn => {
  const [settings, setSettings] = useState<PreferenceSettings>({
    theme: 'system',
    language: 'zh-TW',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { showToast } = useToast();

  const updatePreference = useCallback(async (newSettings: PreferenceSettings) => {
    try {
      setIsLoading(true);
      setSettings(newSettings);

      showToast('設定已更新', 'success', {
        description: '設定已更新'
      });
    } catch (err) {
      showToast('更新失敗', 'error', {
        description: '更新設定失敗'
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  return {
    preferences: settings,
    updatePreferences: updatePreference,
    isLoading,
  };
}; 