import { useState, useEffect } from 'react';
import { useToastContext } from '@/context/ToastContext';
import { logger } from '@/utils/logger';
import { DISCORD_CONFIG } from '@/config/discord';

interface NotificationSettings {
  emailNotification: boolean;
  lineNotification: boolean;
  discordNotification: boolean;
  lineId?: string | null;
  discordId?: string | null;
}

export const useNotificationSettings = (userId: string) => {
  const [originalSettings, setOriginalSettings] = useState<NotificationSettings>({
    emailNotification: false,
    lineNotification: false,
    discordNotification: false,
    lineId: null
  });
  const [tempSettings, setTempSettings] = useState<NotificationSettings>({
    emailNotification: false,
    lineNotification: false,
    discordNotification: false,
    lineId: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToastContext();
  const [isLineVerified, setIsLineVerified] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [isDiscordVerifying, setIsDiscordVerifying] = useState(false);
  const [showDiscordVerification, setShowDiscordVerification] = useState(false);

  // 載入設定
  const reloadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/profile/notification-settings/${userId}`);
      const data = await response.json();
      
      setOriginalSettings({
        emailNotification: data.emailNotification || false,
        lineNotification: data.lineNotification || false,
        discordNotification: data.discordNotification || false,
        lineId: data.lineId || null
      });
      
      setTempSettings({
        emailNotification: data.emailNotification || false,
        lineNotification: data.lineNotification || false,
        discordNotification: data.discordNotification || false,
        lineId: data.lineId || null
      });
    } catch (error) {
      logger.error('載入通知設定失敗:', error);
      showToast('載入設定失敗，請重新整理頁面', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 儲存設定
  const saveSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      setIsSaving(true);
      
      // 準備要更新的資料
      const updateData = {
        userId,
        emailNotification: tempSettings.emailNotification,
        lineNotification: tempSettings.lineNotification
      };

      logger.info('準備更新設定:', updateData);

      const response = await fetch('/api/profile/notification-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('儲存設定失敗');
      }

      const data = await response.json();
      logger.info('設定更新成功:', data);

      // 更新本地狀態
      setTempSettings((prevSettings: NotificationSettings) => ({
        ...prevSettings,
        ...data
      }));

      showToast('設定已更新', 'success', {
        description: '您的通知設定已成功儲存',
        position: 'top-right',
        duration: 3000
      });

      // 在 Toast 消息顯示後重新載入頁面
      setTimeout(() => {
        window.location.reload();
      }, 3000);

      return data;
    } catch (error) {
      logger.error('儲存設定失敗:', error);
      showToast('儲存設定失敗', 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // 處理設定變更
  const handleSettingChange = async (key: string, value: any) => {
    try {
      // 如果是 lineNotification 且目前為 false，則不允許直接切換
      if (key === 'lineNotification' && !originalSettings.lineNotification) {
        return false;
      }

      const newValue = Boolean(value);

      // 檢查互斥條件
      if (newValue) {
        if (key === 'emailNotification' && tempSettings.lineNotification) {
          showToast('無法同時開啟兩種通知', 'warning', {
            description: '請先關閉 LINE 通知',
            position: 'top-right',
            duration: 3000
          });
          return false;
        }
        if (key === 'lineNotification' && tempSettings.emailNotification) {
          showToast('無法同時開啟兩種通知', 'warning', {
            description: '請先關閉電子郵件通知',
            position: 'top-right',
            duration: 3000
          });
          return false;
        }
      }

      setTempSettings(prev => ({ ...prev, [key]: newValue }));

      // 如果是關閉 LINE 通知，立即更新資料庫
      if (key === 'lineNotification' && !newValue) {
        try {
          // 更新資料庫
          await fetch('/api/profile/notification-settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              lineNotification: false,
              emailNotification: tempSettings.emailNotification
            })
          });

          // 顯示成功訊息
          showToast('LINE 通知已關閉', 'success', {
            description: '設定已更新',
            position: 'top-right',
            duration: 3000
          });

          // 3秒後重整頁面
          setTimeout(() => {
            window.location.reload();
          }, 3000);

        } catch (error) {
          logger.error('更新 LINE 通知設定失敗:', error);
          showToast('更新設定失敗', 'error');
          throw error;
        }
      }

      return true;
    } catch (error) {
      logger.error('更新設定失敗:', error);
      showToast('更新設定失敗', 'error');
      return false;
    }
  };

  // 置設定
  const resetSettings = () => {
    setTempSettings(originalSettings);
    showToast('已取消設定', 'info', {
      description: '設定已重置為原始狀態',
      position: 'top-right',
      duration: 3000
    });
  };

  // 檢查是否有變更
  const hasChanges = JSON.stringify(tempSettings) !== JSON.stringify(originalSettings);

  // 新增驗證完成後的處理函數
  const handleVerificationComplete = async () => {
    try {
      setIsLoading(true);
      // 更新 LINE 通知設定
      const response = await fetch('/api/profile/notification-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          lineNotification: true
        })
      });

      if (!response.ok) {
        throw new Error('更新 LINE 通知設定失敗');
      }

      const data = await response.json();
      setOriginalSettings(prev => ({
        ...prev,
        lineNotification: true,
        lineId: data.lineId
      }));
      setTempSettings(prev => ({
        ...prev,
        lineNotification: true,
        lineId: data.lineId
      }));

      showToast('LINE 驗證成功', 'success');
      
      // 延遲 3 秒後重新載入頁面
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
      return true;
    } catch (error) {
      logger.error('LINE 驗證完成處理失敗:', error);
      showToast('更新 LINE 通知設定失敗', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 修改 startVerification 函數
  const startVerification = () => {
    setShowVerification(true);
    // 重置相關狀態
    setTempSettings(prev => ({
      ...prev,
      lineNotification: false,
      lineId: null
    }));
  };

  // 新增取消驗證的函數
  const cancelVerification = () => {
    setShowVerification(false);
    // 重置相關狀態
    setTempSettings(originalSettings);
  };

  // 處理 Discord 驗證開始
  const startDiscordVerification = () => {
    setShowDiscordVerification(true);
    setTempSettings(prev => ({
      ...prev,
      discordNotification: false,
      discordId: null
    }));
  };

  // 處理 Discord 驗證取消
  const cancelDiscordVerification = () => {
    setShowDiscordVerification(false);
    setTempSettings(originalSettings);
  };

  // 處理 Discord 驗證完成
  const handleDiscordVerificationComplete = async (discordId: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/profile/notification-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          discordNotification: true,
          discordId
        })
      });

      if (!response.ok) {
        throw new Error('更新 Discord 通知設定失敗');
      }

      const data = await response.json();
      
      setOriginalSettings(prev => ({
        ...prev,
        discordNotification: true,
        discordId: data.discordId
      }));
      
      setTempSettings(prev => ({
        ...prev,
        discordNotification: true,
        discordId: data.discordId
      }));

      showToast('Discord 驗證成功', 'success');
      
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
      return true;
    } catch (error) {
      logger.error('Discord 驗證完成處理失敗:', error);
      showToast('更新 Discord 通知設定失敗', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 處理 Discord 設定變更
  const handleDiscordToggle = async () => {
    try {
      if (!tempSettings.discordNotification) {
        // 開啟 Discord 通知
        if (!tempSettings.discordId) {
          startDiscordVerification();
          return false;
        }
      } else {
        // 關閉 Discord 通知
        if (window.confirm('確定關閉 Discord 通知嗎？')) {
          const response = await fetch('/api/profile/notification-settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              discordNotification: false
            })
          });

          if (!response.ok) {
            throw new Error('更新 Discord 通知設定失敗');
          }

          showToast('Discord 通知已關閉', 'success');
          
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        }
      }
      return true;
    } catch (error) {
      logger.error('更新 Discord 設定失敗:', error);
      showToast('更新設定失敗', 'error');
      return false;
    }
  };

  const startDiscordAuth = async () => {
    try {
      logger.info('開始 Discord 授權流程');
      
      // 發送 Discord 授權請求
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

      // 開啟授權視窗
      const authWindow = window.open(
        data.authUrl,
        'Discord 授權',
        'width=500,height=700'
      );

      if (!authWindow) {
        throw new Error('無法開啟 Discord 授權視窗');
      }

      // 監聽授權結果
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'DISCORD_AUTH_SUCCESS') {
          logger.info('Discord 授權成功:', event.data);
          if (authWindow) {
            authWindow.close();
          }
          
          // 更新通知設定
          await fetch('/api/profile/notification-settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              discordNotification: true,
              discordId: event.data.discord_id
            })
          });

          // 更新本地狀態
          setTempSettings(prev => ({
            ...prev,
            discordNotification: true,
            discordId: event.data.discord_id
          }));

          // 顯示成功訊息
          showToast('Discord 驗證成功', 'success', {
            description: '您現在可以接收 Discord 通知了',
            duration: 3000
          });
          
          // 重新載入設定
          await reloadSettings();
        }
      });
    } catch (error) {
      logger.error('啟動 Discord 授權失敗:', error);
      showToast('Discord 授權失敗', 'error', {
        description: error instanceof Error ? error.message : '請稍後再試或聯繫管理員',
        duration: 5000
      });
    }
  };

  useEffect(() => {
    reloadSettings();
  }, [userId]);

  return {
    settings: tempSettings,
    originalSettings,
    isLineVerified,
    isLoading,
    isSaving,
    hasChanges,
    handleSettingChange,
    saveSettings,
    reloadSettings,
    handleSendUserId: async () => {
      return true;
    },
    handleVerifyCode: async (code: string) => {
      return true;
    },
    resetSettings,
    handleVerificationComplete,
    showVerification,
    startVerification,
    cancelVerification,
    isDiscordVerifying,
    showDiscordVerification,
    startDiscordVerification,
    cancelDiscordVerification,
    handleDiscordVerificationComplete,
    handleDiscordToggle,
    startDiscordAuth
  };
};