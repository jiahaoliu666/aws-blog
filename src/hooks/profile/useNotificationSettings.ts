import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { logger } from '@/utils/logger';
import { useToastContext } from '@/context/ToastContext';

enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED'
}

interface NotificationSettings {
  email: boolean;
  line: boolean;
  lineUserId?: string;
  lineNotification: {
    enabled: boolean;
    isVerified: boolean;
    verificationStatus: VerificationStatus;
  };
}

export const useNotificationSettings = (userId: string) => {
  const [settings, setSettings] = useState({
    line: false,
    email: false
  });
  const [originalSettings, setOriginalSettings] = useState({
    line: false,
    email: false
  });
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const toast = useToastContext();

  const checkChanges = (newSettings: any) => {
    return JSON.stringify(newSettings) !== JSON.stringify(originalSettings);
  };

  const handleToggle = async (type: 'line' | 'email', value: boolean) => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/profile/notification-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type,
          enabled: value
        }),
      });

      if (!response.ok) {
        throw new Error('更新設定失敗');
      }

      const newSettings = {
        ...settings,
        [type]: value
      };
      setSettings(newSettings);
      setHasChanges(checkChanges(newSettings));
      
    } catch (error) {
      toast.error('更新通知設定失敗');
      logger.error('切換通知設定失敗:', error);
      setSettings(prev => ({
        ...prev,
        [type]: !value
      }));
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (loading || !hasChanges) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/profile/notification-settings/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          settings
        }),
      });

      if (!response.ok) {
        throw new Error('儲存設定失敗');
      }

      setOriginalSettings({...settings});
      setHasChanges(false);
      toast.success('通知設定已更新');
    } catch (error) {
      toast.error('儲存設定失敗');
      logger.error('儲存通知設定失敗:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const reloadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/profile/notification-settings?userId=${userId}`);
      if (!response.ok) {
        throw new Error('載入設定失敗');
      }
      const data = await response.json();
      setSettings(data.settings);
      setOriginalSettings(data.settings);
      setHasChanges(false);
    } catch (error) {
      toast.error('載入設定失敗');
      logger.error('重新載入通知設定失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    originalSettings,
    loading,
    hasChanges,
    handleToggle,
    saveSettings,
    reloadSettings,
    handleSendUserId: async () => {
      // 實作發送用戶 ID 的邏輯
    },
    handleVerifyCode: async (code: string) => {
      // 實作驗證碼驗證的邏輯
    }
  };
};