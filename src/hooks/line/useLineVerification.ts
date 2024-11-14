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
    return withRetry(
      async () => {
        try {
          updateVerificationProgress(VerificationStep.VERIFY_CODE);

          setVerificationState(prev => ({
            ...prev,
            status: VerificationStatus.VALIDATING,
            message: '驗證進行中...',
            retryCount: prev.retryCount + 1
          }));

          const response = await lineVerificationService.verifyCode(userId, code);

          if (response.success) {
            setVerificationState(prev => ({
              ...prev,
              step: VerificationStep.VERIFY_CODE,
              status: VerificationStatus.SUCCESS,
              message: '驗證成功！',
              isVerified: true,
              progress: 100
            }));
            return true;
          }

          throw new Error(response.message || '驗證失敗');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '未知錯誤';
          
          setVerificationState(prev => ({
            ...prev,
            status: VerificationStatus.ERROR,
            message: errorMessage
          }));

          logger.error('LINE 驗證失敗:', { error: errorMessage });
          throw error;
        }
      },
      {
        operationName: 'LINE 驗證碼驗證',
        retryCount: 3,
        retryDelay: 1000
      }
    );
  };

  return {
    verificationState,
    handleVerifyCode
  };
}; 