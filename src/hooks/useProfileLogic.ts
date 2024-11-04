import { useState } from 'react';
import { logger } from '@/utils/logger';
import { updateUser } from '../api/user';

export const useProfileLogic = (user: { userId: string }) => {
  const [verificationState, setVerificationState] = useState<{
    step: 'idle' | 'verifying' | 'confirming' | 'complete';
    code?: string;
  }>({ step: 'idle' });

  const verifyLineId = async (lineId: string) => {
    try {
      const response = await fetch('/api/line/check-follow-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lineId,
          userId: user.userId 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // 更新用戶狀態
        updateUser({
          lineSettings: {
            id: lineId,
            isVerified: true,
            status: 'success'
          }
        });
        return true;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      // 更新驗證失敗狀態
      updateUser({
        lineSettings: {
          id: lineId, 
          isVerified: false,
          status: 'error'
        }
      });
      return false;
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

  return { verificationState, verifyLineId, confirmVerification };
}; 