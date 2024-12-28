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
      
      const settingsToUpdate = {
        ...tempSettings,
        discordId: tempSettings.discordNotification ? settings.discordId : null
      };
      
      await updateSettings(settingsToUpdate);
      setSettings(settingsToUpdate);
      setHasChanges(false);
      showToast('設定已更新', 'success');

      // 添加延遲後重新載入頁面
      setTimeout(() => {
        window.location.reload();
      }, 1500); // 等待 1.5 秒讓使用者看到成功訊息後再重整

    } catch (error) {
      showToast('儲存設定失敗', 'error');
      logger.error('儲存設定失敗:', error);
      setTempSettings(settings);
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

  const handleDiscordVerificationComplete = async (discordId: string): Promise<boolean> => {
    try {
      await updateSettings({ discordNotification: true, discordId });
      setIsDiscordVerifying(false);
      setShowDiscordVerification(false);
      showToast('Discord 綁定成功', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
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
          
          setTimeout(() => {
            window.location.reload();
          }, 3000);
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
  }, [isDiscordVerifying, showToast, setSettings]);

  const startDiscordAuth = async () => {
    try {
      if (!userId) {
        throw new Error('缺少用戶 ID');
      }

      const response = await fetch('/api/discord/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Discord 授權失敗');
      }

      if (data.authUrl) {
        // 開啟 Discord 授權視窗
        const authWindow = window.open(
          data.authUrl, 
          'discord-auth',
          'width=800,height=600,location=yes,resizable=yes,scrollbars=yes,status=yes'
        );

        // 檢查視窗是否被封鎖
        if (authWindow === null) {
          showToast('請允許開啟彈出視窗以完成 Discord 授權', 'warning');
        }
      } else {
        throw new Error('無法獲取授權 URL');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      showToast('Discord 授權失敗', 'error');
      logger.error('Discord 授權失敗:', errorMessage);
      setIsDiscordVerifying(false);
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