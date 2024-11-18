import { useState, useEffect } from 'react';
import { useToastContext } from '@/context/ToastContext';
import { logger } from '@/utils/logger';

interface NotificationSettings {
  emailNotification: boolean;
  lineNotification: boolean;
  lineId?: string | null;
}

export const useNotificationSettings = (userId: string) => {
  const [originalSettings, setOriginalSettings] = useState<NotificationSettings>({
    emailNotification: false,
    lineNotification: false,
    lineId: null
  });
  const [tempSettings, setTempSettings] = useState<NotificationSettings>({
    emailNotification: false,
    lineNotification: false,
    lineId: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToastContext();
  const [isLineVerified, setIsLineVerified] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  // 載入設定
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/profile/notification-settings/${userId}`);
      const data = await response.json();
      
      setOriginalSettings({
        emailNotification: data.emailNotification || false,
        lineNotification: data.lineNotification || false,
        lineId: data.lineId || null
      });
      
      setTempSettings({
        emailNotification: data.emailNotification || false,
        lineNotification: data.lineNotification || false,
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

  useEffect(() => {
    loadSettings();
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
    reloadSettings: loadSettings,
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
  };
};