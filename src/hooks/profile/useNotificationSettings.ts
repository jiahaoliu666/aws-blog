import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { logger } from '@/utils/logger';
import { useToastContext } from '@/context/ToastContext';
import { VerificationStep } from '@/types/lineTypes';

interface NotificationSettings {
  email: boolean;
  line: boolean;
}

export const useNotificationSettings = (userId: string) => {
  const { showToast } = useToastContext();
  const [settings, setSettings] = useState<NotificationSettings>({
    email: false,
    line: false
  });
  const [tempSettings, setTempSettings] = useState<NotificationSettings>({
    email: false,
    line: false
  });
  const [loading, setLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState<VerificationStep>(VerificationStep.ADD_FRIEND);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  // 初始化載入設定
  useEffect(() => {
    const fetchSettings = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/profile/notification-settings?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error('獲取設定失敗');
        }

        const data = await response.json();
        const newSettings = {
          email: data.email,
          line: data.line
        };
        
        setSettings(newSettings);
        setTempSettings(newSettings);
      } catch (err) {
        logger.error('獲取通知設定失敗:', err);
        toast.error('載入設定失敗，請重新整理頁面');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [userId]);

  // 處理切換設定
  const handleToggle = async (type: keyof NotificationSettings) => {
    if (type === 'line' && !tempSettings.line) {
      // 當開啟 LINE 通知時，重置驗證流程
      setVerificationStep(VerificationStep.ADD_FRIEND);
      setVerificationProgress(33);
      setIsVerified(false);
    }

    const newSettings = {
      ...tempSettings,
      [type]: !tempSettings[type]
    };
    setTempSettings(newSettings);
  };

  // 儲存設定
  const saveSettings = async () => {
    if (!userId) {
      showToast('無法儲存設定', 'error', {
        description: '請先登入後再試',
        position: 'top-right',
        duration: 3000
      });
      return;
    }

    try {
      setLoading(true);
      showToast('正在儲存設定...', 'loading', {
        description: '請稍候',
        position: 'top-right',
        duration: 1000
      });

      const response = await fetch('/api/profile/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          email: tempSettings.email,
          line: tempSettings.line
        })
      });

      if (!response.ok) {
        throw new Error('儲存設定失敗');
      }

      const data = await response.json();
      setSettings({
        email: data.email,
        line: data.line
      });
      setTempSettings({
        email: data.email,
        line: data.line
      });
      
      showToast('通知設定已更新', 'success', {
        description: '您的通知偏好已成功儲存',
        position: 'top-right',
        duration: 3000
      });
    } catch (err) {
      logger.error('儲存通知設定失敗:', err);
      showToast('儲存失敗', 'error', {
        description: '無法儲存設定，請稍後再試',
        position: 'top-right',
        duration: 4000
      });
      setTempSettings(settings);
    } finally {
      setLoading(false);
    }
  };

  // 重置設定
  const resetSettings = () => {
    setTempSettings(settings);
    showToast('設定已重置', 'info', {
      description: '設定已重置為原始狀態',
      position: 'top-right',
      duration: 3000
    });
  };

  // 添加 hasChanges 的計算
  const hasChanges = JSON.stringify(tempSettings) !== JSON.stringify(settings);

  // 新增驗證相關方法
  const startVerification = () => {
    setVerificationStep(VerificationStep.INPUT_LINE_ID);
    setVerificationProgress(66);
  };

  const handleVerification = () => {
    setVerificationStep(VerificationStep.VERIFY_CODE);
    setVerificationProgress(100);
  };

  const completeVerification = () => {
    setVerificationStep(VerificationStep.COMPLETED);
    setIsVerified(true);
  };

  return {
    settings: tempSettings,
    originalSettings: settings,
    loading,
    handleToggle,
    saveSettings,
    resetSettings,
    hasChanges,
    verificationStep,
    verificationProgress,
    isVerified,
    startVerification,
    handleVerification,
    completeVerification,
  };
};