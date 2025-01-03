import { useState } from 'react';
import { toast } from 'react-toastify';
import { lineVerificationService } from '@/services/lineVerification';
import { VerificationStep, VerificationStatus, VerificationState, VERIFICATION_PROGRESS } from '@/types/lineTypes';
import { withRetry } from '@/utils/retryUtils';
import { logger } from '@/utils/logger';

export type UseLineVerificationReturn = {
  verificationState: VerificationState;
  handleVerifyCode: (code: string, userId: string) => Promise<boolean>;
};

export const useLineVerification = () => {
  const [verificationState, setVerificationState] = useState<VerificationState>({
    step: VerificationStep.SCAN_QR,
    status: VerificationStatus.IDLE,
    isVerified: false,
    retryCount: 0,
    message: '',
    progress: 0,
    currentStep: 0
  });

  const updateVerificationProgress = (step: VerificationStep) => {
    const stepIndex = Object.values(VerificationStep).indexOf(step);
    const progress = stepIndex === 0 ? 0 : (stepIndex / (Object.values(VerificationStep).length - 1)) * 100;
    
    setVerificationState(prev => ({
      ...prev,
      step,
      progress,
      currentStep: stepIndex
    }));
  };

  const handleVerifyCode = async (code: string, userId: string) => {
    try {
      logger.info('開始驗證碼驗證:', { userId, code });

      const response = await fetch('/api/line/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '驗證失敗');
      }

      if (data.success) {
        toast.success('驗證成功！', {
          onClose: () => {
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        });
      }

      return data;
    } catch (error) {
      logger.error('驗證碼驗證失敗:', error);
      throw error;
    }
  };

  return {
    verificationState,
    handleVerifyCode
  };
}; 