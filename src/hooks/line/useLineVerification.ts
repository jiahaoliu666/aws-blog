import { useState } from 'react';
import { toast } from 'react-toastify';
import { lineVerificationService } from '@/services/lineVerification';
import { VerificationStep, VerificationStatus, VerificationState } from '@/types/lineTypes';
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
    retryCount: 0
  });

  const handleVerifyCode = async (code: string, userId: string) => {
    return withRetry(
      async () => {
        try {
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