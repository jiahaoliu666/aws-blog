import { useState, useEffect } from 'react';
import { lineService } from '@/services/lineService';
import { toast } from 'react-toastify';
import { logger } from '@/utils/logger';
import { User } from '@/types/userType';
import { VerificationState } from '@/types/lineTypes';

enum VerificationStep {
  IDLE = 'idle',
  VERIFYING = 'verifying',
  CONFIRMING = 'confirming',
  COMPLETE = 'complete'
}

enum VerificationStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  VALIDATING = 'validating',
  SUCCESS = 'success',
  ERROR = 'error'
}

interface UseLineVerificationProps {
  user: User | null;
  updateUserLineSettings: (settings: any) => Promise<void>;
}

const createVerificationTemplate = (code: string) => {
  return `您的驗證碼是：${code}\n請在網頁上輸入此驗證碼完成驗證。`;
};

export const useLineVerification = (user: User | null) => {
  const [verificationState, setVerificationState] = useState<VerificationState>({
    step: 'idle',
    status: 'idle',
    message: '',
    isVerified: false
  });
  const [lineId, setLineId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // 檢查驗證狀態
  const checkVerificationStatus = async () => {
    if (!user?.sub) return;
    
    try {
      const response = await fetch(`/api/line/verify/status?userId=${user.sub}`);
      const data = await response.json();
      
      if (data.isVerified) {
        setVerificationState({
          step: 'complete',
          status: 'success',
          message: '驗證成功',
          isVerified: true
        });
      }
    } catch (error) {
      logger.error('檢查驗證狀態失敗:', error);
    }
  };

  // 驗證 LINE ID 和驗證碼
  const verifyLineIdAndCode = async () => {
    if (!user?.sub || !lineId || !verificationCode) {
      toast.error('請輸入 LINE ID 和驗證碼');
      return;
    }

    try {
      setVerificationState(prev => ({
        ...prev,
        status: 'validating',
        message: '正在驗證...'
      }));

      const response = await fetch('/api/line/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.sub,
          lineId,
          verificationCode
        })
      });

      const data = await response.json();

      if (data.success) {
        setVerificationState({
          step: 'complete',
          status: 'success',
          message: '驗證成功！',
          isVerified: true
        });
        toast.success('LINE 驗證成功');
      } else {
        throw new Error(data.message || '驗證失敗');
      }
    } catch (error) {
      setVerificationState(prev => ({
        ...prev,
        status: 'error',
        message: error instanceof Error ? error.message : '驗證失敗'
      }));
      toast.error('驗證失敗，請確認 LINE ID 和驗證碼是否正確');
    }
  };

  useEffect(() => {
    checkVerificationStatus();
  }, [user?.sub]);

  return {
    verificationState,
    lineId,
    setLineId,
    verificationCode,
    setVerificationCode,
    verifyLineIdAndCode
  };
};

export type UseLineVerificationReturn = {
  // 在這裡定義您的型別
}; 