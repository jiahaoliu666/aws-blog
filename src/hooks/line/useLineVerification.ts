import { useState } from 'react';
import { User } from '@/types/userType';
import { VerificationState } from '@/types/lineTypes';
import { lineService } from '@/services/lineService';
import { toast } from 'react-toastify';
import { logger } from '@/utils/logger';

interface UseLineVerificationProps {
  user: User | null;
  updateUserLineSettings: (settings: any) => Promise<void>;
}

export const useLineVerification = ({ user, updateUserLineSettings }: UseLineVerificationProps) => {
  const [verificationState, setVerificationState] = useState<VerificationState>({
    step: 'idle',
    status: 'idle',
    message: '',
    isVerified: false
  });
  
  const [verificationCode, setVerificationCode] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [lineId, setLineId] = useState('');
  const MAX_RETRY = 3;

  // 開始驗證流程
  const startVerification = async () => {
    try {
      setVerificationState(prev => ({
        ...prev,
        step: 'verifying',
        status: 'pending',
        message: '正在處理驗證請求...'
      }));

      if (!user?.sub) {
        throw new Error('找不到用戶ID');
      }

      if (!lineId.match(/^U[0-9a-f]{32}$/i)) {
        throw new Error('請輸入有效的 LINE ID');
      }

      const newState: VerificationState = {
        step: 'verifying',
        status: 'idle',
        message: '請輸入您的 LINE ID，然後發送「驗證 {您的用戶ID}」到 LINE 官方帳號',
        isVerified: false
      };

      setVerificationState(newState);

      await updateUserLineSettings({
        lineId,
        isVerified: false,
        displayName: user?.username || '',
        verificationState: newState
      });

    } catch (error) {
      logger.error('開始驗證失敗:', error);
      setVerificationState(prev => ({
        ...prev,
        status: 'error',
        message: '驗證請求失敗，請稍後重試'
      }));
      toast.error('驗證請求失敗');
    }
  };

  // 確認驗證碼
  const confirmVerificationCode = async (code: string) => {
    try {
      setVerificationState(prev => ({
        ...prev,
        status: 'validating',
        message: '正在驗證...'
      }));

      if (!user?.sub) {
        throw new Error('找不到用戶ID');
      }

      const validatingState: VerificationState = {
        step: 'confirming',
        status: 'validating',
        message: '正在驗證...',
        isVerified: false
      };

      setVerificationState(validatingState);

      await updateUserLineSettings({
        lineId,
        isVerified: false,
        displayName: user?.username || '',
        verificationState: validatingState
      });

      const response = await lineService.verifyCode(lineId, code);

      if (response.success) {
        const successState: VerificationState = {
          step: 'complete',
          status: 'success',
          message: '驗證成功！',
          isVerified: true
        };

        setVerificationState(successState);
        toast.success('LINE 帳號驗證成功');

        await updateUserLineSettings({
          lineId,
          isVerified: true,
          displayName: user?.username || '',
          verificationState: successState
        });

      } else {
        throw new Error(response.message || '驗證失敗');
      }

    } catch (error) {
      logger.error('驗證碼確認失敗:', error);
      setVerificationState(prev => ({
        ...prev,
        status: 'error',
        message: '驗證失敗'
      }));
      toast.error('驗證失敗');
    }
  };

  // 重試驗證
  const handleVerificationRetry = async () => {
    if (retryCount >= MAX_RETRY) {
      setVerificationState({
        step: 'idle',
        status: 'error',
        message: '已超過最大重試次數，請稍後再試'
      });
      toast.error('已超過重試次數限制');
      return;
    }
    
    setRetryCount(prev => prev + 1);
    await startVerification();
  };

  // 重置驗證狀態
  const resetVerification = () => {
    setVerificationState({
      step: 'idle',
      status: 'idle',
      message: '',
      isVerified: false
    });
    setVerificationCode('');
    setRetryCount(0);
  };

  return {
    verificationState,
    verificationCode,
    lineId,
    setVerificationCode,
    setLineId,
    startVerification,
    confirmVerificationCode,
    handleVerificationRetry,
    resetVerification
  };
};

export type UseLineVerificationReturn = {
  // 在這裡定義您的型別
}; 