import { useState, useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';
import { useToastContext } from '@/context/ToastContext';

export const useNotificationSettings = (userId: string) => {
  const { showToast } = useToastContext();
  const [settings, setSettings] = useState({
    emailNotification: false,
    lineNotification: false,
    discordNotification: false,
    lineId: null,
    lineUserId: null,
    discordId: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isDiscordVerifying, setIsDiscordVerifying] = useState(false);
  const [showDiscordVerification, setShowDiscordVerification] = useState(false);
  const [tempSettings, setTempSettings] = useState({
    emailNotification: false,
    lineNotification: false,
    discordNotification: false,
    lineId: null,
    lineUserId: null,
    discordId: null
  });

  const fetchSettings = async (isInitialLoad: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/profile/notification-settings/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('獲取設定失敗');
      }

      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
        setTempSettings(data.settings);
        return data.settings;
      } else {
        throw new Error(data.message || '獲取設定失敗');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      setError(errorMessage);
      if (!isInitialLoad) {
        showToast('載入設定失敗', 'error');
      }
      logger.error('獲取通知設定失敗:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSettings(true).then(fetchedSettings => {
        if (fetchedSettings) {
          setSettings(fetchedSettings);
          setTempSettings(fetchedSettings);
        }
      });
    }
  }, [userId]);

  const updateSettings = async (newSettings: any) => {
    setHasChanges(true);
    try {
      setIsLoading(true);
      const response = await fetch('/api/profile/notification-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          ...newSettings
        })
      });

      if (!response.ok) {
        throw new Error('更新設定失敗');
      }

      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
        showToast('設定已更新', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(data.message || '更新設定失敗');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      setError(errorMessage);
      showToast('更新設定失敗', 'error');
      logger.error('更新通知設定失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = async () => {
    setTempSettings(settings);
    setHasChanges(false);
    showToast('設定已重置', 'info');
  };

  const startVerification = () => {
    setShowVerification(true);
  };

  const handleSettingChange = async (type: string, value: boolean): Promise<boolean> => {
    setHasChanges(true);
    setTempSettings(prev => ({
      ...prev,
      [`${type}Notification`]: value
    }));
    return true;
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      
      // 如果 Discord 通知被關閉，直接發送請求刪除所有設定
      if (!tempSettings.discordNotification) {
        const response = await fetch('/api/profile/notification-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            discordNotification: false
          })
        });

        const data = await response.json();
        
        if (data.success) {
          setSettings(data.settings);
          setHasChanges(false);
          showToast('設定已更新', 'success');
          
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          
          return true;
        } else {
          throw new Error(data.message || '更新設定失敗');
        }
      }

      const settingsToUpdate = {
        ...tempSettings,
        discordId: tempSettings.discordNotification ? settings.discordId : null
      };
      
      await updateSettings(settingsToUpdate);
      setSettings(settingsToUpdate);
      setHasChanges(false);

      showToast('設定已更新', 'success');
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);

      return true;

    } catch (error) {
      showToast('儲存設定失敗', 'error');
      logger.error('儲存設定失敗:', error);
      setTempSettings(settings);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendUserId = async (lineId: string) => {
    try {
      const response = await fetch('/api/line/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, lineId })
      });
      return response.ok;
    } catch (error) {
      logger.error('發送驗證碼失敗:', error);
      return false;
    }
  };

  const handleVerifyCode = async (code: string) => {
    try {
      const response = await fetch('/api/line/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code })
      });
      return response.ok;
    } catch (error) {
      logger.error('驗證碼驗證失敗:', error);
      return false;
    }
  };

  const reloadSettings = async () => {
    await fetchSettings();
  };

  const cancelVerification = () => {
    setShowVerification(false);
  };

  const startDiscordVerification = () => {
    setShowDiscordVerification(true);
    setIsDiscordVerifying(true);
  };

  const cancelDiscordVerification = () => {
    setShowDiscordVerification(false);
    setIsDiscordVerifying(false);
  };

  const handleDiscordVerificationComplete = async (discordId: string) => {
    try {
      await updateSettings({ discordNotification: true, discordId });
      setIsDiscordVerifying(false);
      setShowDiscordVerification(false);
      return true;
    } catch (error) {
      logger.error('Discord 驗證完成處理失敗:', error);
      return false;
    }
  };

  const handleDiscordToggle = async (enabled: boolean) => {
    setTempSettings(prev => ({
      ...prev,
      discordNotification: enabled,
    }));
    setHasChanges(true);
  };

  useEffect(() => {
    const handleDiscordAuthMessage = (event: MessageEvent) => {
      if (event.data.type === 'DISCORD_AUTH_SUCCESS') {
        if (isDiscordVerifying) {
          setSettings(prev => ({
            ...prev,
            discordId: event.data.discord_id,
            discordNotification: true
          }));
          setShowDiscordVerification(false);
          setIsDiscordVerifying(false);
          
          showToast('Discord 綁定成功', 'success');
          
          // 延遲 1 秒後刷新頁面
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else if (event.data.type === 'DISCORD_AUTH_ERROR') {
        if (isDiscordVerifying) {
          showToast(event.data.error || 'Discord 綁定失敗', 'error');
          setIsDiscordVerifying(false);
          logger.error('Discord 授權失敗:', event.data.error);
        }
      }
    };

    window.addEventListener('message', handleDiscordAuthMessage);
    return () => window.removeEventListener('message', handleDiscordAuthMessage);
  }, [isDiscordVerifying]);

  const startDiscordAuth = async (userId: string): Promise<Window | null> => {
    try {
      const response = await fetch(
        `/api/discord/auth?userId=${encodeURIComponent(userId)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '獲取 Discord 授權 URL 失敗');
      }

      if (data.url) {
        const authWindow = window.open(
          data.url,
          'discord-auth',
          'width=800,height=600,location=yes,resizable=yes,scrollbars=yes,status=yes'
        );

        if (authWindow === null) {
          showToast('請允許開啟彈出視窗以完成 Discord 授權', 'warning');
        }
        
        setIsDiscordVerifying(true);
        return authWindow;
      } else {
        throw new Error('未獲得有效的授權 URL');
      }
    } catch (error) {
      console.error('啟動 Discord 授權失敗:', error);
      showToast('Discord 授權失敗', 'error');
      setIsDiscordVerifying(false);
      return null;
    }
  };

  return {
    settings: tempSettings,
    setSettings,
    originalSettings: settings,
    resetSettings,
    saveSettings,
    handleSettingChange,
    hasChanges,
    isLoading,
    error,
    updateSettings,
    fetchSettings,
    showVerification,
    startVerification,
    handleSendUserId,
    handleVerifyCode,
    reloadSettings,
    cancelVerification,
    isDiscordVerifying,
    setIsDiscordVerifying,
    showDiscordVerification,
    setShowDiscordVerification,
    startDiscordVerification,
    cancelDiscordVerification,
    handleDiscordVerificationComplete,
    handleDiscordToggle,
    startDiscordAuth,
  };
};