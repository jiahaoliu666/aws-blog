import { useState, useEffect } from 'react';
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

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/profile/notification-settings/${userId}`, {
        method: 'GET', // 明確指定使用 GET 方法
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
      } else {
        throw new Error(data.message || '獲取設定失敗');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      setError(errorMessage);
      showToast('載入設定失敗', 'error');
      logger.error('獲取通知設定失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSettings();
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
    try {
      setIsLoading(true);
      await fetchSettings(); // 重新獲取原始設定
      showToast('設定已重置', 'success');
    } catch (error) {
      showToast('重置設定失敗', 'error');
      logger.error('重置設定失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startVerification = () => {
    setShowVerification(true);
  };

  const handleSettingChange = async (type: string, value: boolean): Promise<boolean> => {
    try {
      setHasChanges(true);
      const newSettings = {
        ...settings,
        [`${type}Notification`]: value
      };
      await updateSettings(newSettings);
      return true;
    } catch (error) {
      logger.error('設定更新失敗:', error);
      return false;
    }
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);
      await updateSettings(settings);
      setHasChanges(false);
    } catch (error) {
      showToast('儲存設定失敗', 'error');
      logger.error('儲存設定失敗:', error);
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
      return true;
    } catch (error) {
      logger.error('Discord 驗證完成處理失敗:', error);
      return false;
    }
  };

  const handleDiscordToggle = async (enabled: boolean) => {
    await updateSettings({ discordNotification: enabled });
  };

  useEffect(() => {
    const handleDiscordAuthMessage = (event: MessageEvent) => {
      if (event.data.type === 'DISCORD_AUTH_SUCCESS') {
        // 授權成功
        showToast('Discord 連結成功', 'success');
        setSettings(prev => ({
          ...prev,
          discordId: event.data.discord_id,
          discordNotification: true
        }));
        setShowDiscordVerification(false);
        setIsDiscordVerifying(false);
        reloadSettings(); // 重新載入設定以確保資料同步
      } else if (event.data.type === 'DISCORD_AUTH_ERROR') {
        // 授權失敗
        showToast(event.data.error || 'Discord 連結失敗', 'error');
        setIsDiscordVerifying(false);
        logger.error('Discord 授權失敗:', event.data.error);
      }
    };

    window.addEventListener('message', handleDiscordAuthMessage);
    return () => window.removeEventListener('message', handleDiscordAuthMessage);
  }, []);

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
    settings,
    isLoading,
    error,
    updateSettings,
    fetchSettings,
    resetSettings,
    showVerification,
    startVerification,
    hasChanges,
    handleSettingChange,
    saveSettings,
    handleSendUserId,
    handleVerifyCode,
    reloadSettings,
    cancelVerification,
    isDiscordVerifying,
    showDiscordVerification,
    startDiscordVerification,
    cancelDiscordVerification,
    handleDiscordVerificationComplete,
    handleDiscordToggle,
    startDiscordAuth,
  };
};