import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { logger } from '@/utils/logger';
import { useToastContext } from '@/context/ToastContext';
import { VerificationStep } from '@/types/lineTypes';
import { lineVerificationService } from '@/services/lineVerification';
import { useAuthContext } from '@/context/AuthContext';

interface NotificationSettings {
  email: boolean;
  line: boolean;
  lineUserId?: string;
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
  const [verificationStep, setVerificationStep] = useState<VerificationStep>(VerificationStep.SCAN_QR);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/line/verification-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });
      
      const data = await response.json();
      if (response.ok) {
        const newSettings = {
          ...settings,
          line: data.isVerified
        };
        setSettings(newSettings);
        setOriginalSettings(newSettings);
      }
    } catch (error) {
      console.error('載入設定失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadSettings();
    }
  }, [userId]);

  const resetSettings = () => {
    setSettings(originalSettings);
    setHasChanges(false);
  };

  const handleSendUserId = async () => {
    // 實作發送用戶 ID 的邏輯
  };

  const handleVerifyCode = async (code: string) => {
    // 實作驗證碼驗證的邏輯
  };

  return {
    settings,
    originalSettings,
    loading,
    hasChanges,
    verificationStep,
    verificationProgress,
    isVerified,
    handleToggle: (type: 'line' | 'email') => {
      setSettings(prev => ({
        ...prev,
        [type]: !prev[type]
      }));
      setHasChanges(true);
    },
    saveSettings: async () => {
      // 實作儲存設定的邏輯
    },
    resetSettings,
    handleSendUserId,
    handleVerifyCode,
    reloadSettings: loadSettings
  };
};