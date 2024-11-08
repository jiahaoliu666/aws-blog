import { useState } from 'react';
import { lineService } from '@/services/lineService';
import { toast } from 'react-toastify';
import { logger } from '@/utils/logger';
import { User } from '@/types/userType';
import { VerificationState } from '@/types/lineTypes';

interface UseLineVerificationProps {
  user: User | null;
  updateUserLineSettings: (settings: any) => Promise<void>;
}

export const useLineVerification = ({ user, updateUserLineSettings }: UseLineVerificationProps) => {
  const [lineId, setLineId] = useState('');
  const [verificationState, setVerificationState] = useState<VerificationState>({
    step: 'idle',
    status: 'idle',
    message: '',
    isVerified: false
  });
  const [retryCount, setRetryCount] = useState(0);
  const [isLineFollowed, setIsLineFollowed] = useState(false);
  const MAX_RETRY = 3;

  const checkLineFollowStatus = async () => {
    try {
      if (!lineId) {
        toast.error('請先輸入 LINE ID');
        return;
      }

      if (user?.sub) {
        const response = await lineService.checkFollowStatus(lineId);
        setIsLineFollowed(response.isFollowing);
        
        const newState = response.isFollowing ? {
          step: 'verifying' as const,
          status: 'idle' as const,
          message: '請輸入您的 LINE ID，然後發送「驗證 {您的用戶ID}」到 LINE 官方帳號',
          isVerified: false
        } : {
          step: 'idle' as const,
          status: 'idle' as const,
          message: '請先加入 LINE 官方帳號為好友',
          isVerified: false
        };

        setVerificationState(newState);
        
        if (lineId) {
          await updateUserLineSettings({
            lineId,
            isVerified: false,
            displayName: user?.username || '',
            verificationState: newState
          });
        }
      }
    } catch (error) {
      logger.error('檢查 LINE 好友狀態失敗:', error);
      toast.error('檢查 LINE 好友狀態失敗，請稍後重試');
    }
  };

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
      setVerificationState(prev => ({
        ...prev,
        status: 'error',
        message: '驗證請求失敗，請稍後重試'
      }));
    }
  };

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
      setVerificationState(prev => ({
        ...prev,
        status: 'error',
        message: '驗證過程發生錯誤'
      }));
    }
  };

  const handleVerificationRetry = async () => {
    if (retryCount >= MAX_RETRY) {
      setVerificationState({
        step: 'idle',
        status: 'error',
        message: '已超過最大重試次數，請稍後再試'
      });
      return;
    }
    
    setRetryCount(prev => prev + 1);
    await startVerification();
  };

  return {
    lineId,
    setLineId,
    verificationState,
    isLineFollowed,
    checkLineFollowStatus,
    startVerification,
    confirmVerificationCode,
    handleVerificationRetry
  };
};

export type UseLineVerificationReturn = {
  // 在這裡定義您的型別
}; 