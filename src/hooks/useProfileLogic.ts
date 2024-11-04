import { useState } from 'react';
import { logger } from '@/utils/logger';
import { updateUser } from '../api/user';

export const useProfileLogic = (user: { userId: string }) => {
  const [verificationState, setVerificationState] = useState<{
    step: 'idle' | 'verifying' | 'confirming' | 'complete';
    code?: string;
  }>({ step: 'idle' });

  const handleVerifyLineId = async (lineId: string) => {
    try {
      setVerificationState({ step: 'verifying' });
      
      if (!user?.userId) {
        throw new Error('用戶未登入');
      }

      // 發送驗證請求
      await fetch('/api/line/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.userId,
          lineId: lineId
        })
      });

      // 更新狀態
      setVerificationState(prev => ({
        ...prev,
        id: lineId,
        status: 'validating'
      }));

      // 顯示成功訊息
      setVerificationState(prev => ({
        ...prev,
        status: 'success'
      }));

    } catch (error) {
      console.error('LINE ID 驗證失敗:', error);
      setVerificationState(prev => ({
        ...prev,
        status: 'error'
      }));
    }
  };

  const confirmVerification = async (code: string) => {
    try {
      const response = await fetch('/api/line/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId: user.userId })
      });

      if (!response.ok) {
        throw new Error('驗證碼確認失敗');
      }

      setVerificationState({ step: 'complete' });
    } catch (error) {
      logger.error('驗證碼確認失敗:', error);
    }
  };

  return { verificationState, handleVerifyLineId, confirmVerification };
}; 