import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { logger } from '@/utils/logger';
import { useToastContext } from '@/context/ToastContext';
import { VerificationStep } from '@/types/lineTypes';
import { lineVerificationService } from '@/services/lineVerification';

interface NotificationSettings {
  email: boolean;
  line: boolean;
  lineUserId?: string;
}

export const useNotificationSettings = (userId: string) => {
  const { showToast } = useToastContext();
  const [settings, setSettings] = useState<NotificationSettings>({
    email: false,
    line: false,
    lineUserId: undefined
  });
  const [tempSettings, setTempSettings] = useState<NotificationSettings>({
    email: false,
    line: false,
    lineUserId: undefined
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
          line: data.line,
          lineUserId: data.lineUserId
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
          line: tempSettings.line,
          lineUserId: tempSettings.lineUserId
        })
      });

      if (!response.ok) {
        throw new Error('儲存設定失敗');
      }

      const data = await response.json();
      setSettings({
        email: data.email,
        line: data.line,
        lineUserId: data.lineUserId
      });
      setTempSettings({
        email: data.email,
        line: data.line,
        lineUserId: data.lineUserId
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

  // 發送用戶 ID
  const handleSendUserId = async () => {
    try {
      setLoading(true);
      const response = await lineVerificationService.sendUserId(userId);
      
      if (response.success) {
        toast.success('ID 發送成功，請查看 LINE 訊息');
        setVerificationStep(VerificationStep.VERIFY_CODE);
        setVerificationProgress(75);
      } else {
        toast.error(response.message || '發送失敗，請稍後重試');
      }
    } catch (error) {
      toast.error('發送失敗，請稍後重試');
      logger.error('發送用戶 ID 錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  // 驗證驗證碼
  const handleVerifyCode = async (code: string) => {
    try {
      setLoading(true);
      const response = await lineVerificationService.verifyCode(userId, code);
      
      if (response.success) {
        toast.success('驗證成功！');
        setIsVerified(true);
        setVerificationStep(VerificationStep.COMPLETED);
        setVerificationProgress(100);
      } else {
        toast.error(response.message || '驗證失敗，請檢查驗證碼');
      }
    } catch (error) {
      toast.error('驗證失敗，請稍後重試');
      logger.error('驗證碼驗證錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  // 檢查驗證狀態
  const checkVerificationStatus = async () => {
    try {
      const response = await lineVerificationService.checkVerificationStatus(userId);
      
      if (response.success) {
        setIsVerified(true);
        setVerificationStep(VerificationStep.COMPLETED);
        setVerificationProgress(100);
      }
    } catch (error) {
      logger.error('檢查驗證狀態錯誤:', error);
    }
  };

  // 初始化時檢查驗證狀態
  useEffect(() => {
    if (userId) {
      checkVerificationStatus();
    }
  }, [userId]);

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
    handleSendUserId,
    handleVerifyCode,
    checkVerificationStatus,
  };
};