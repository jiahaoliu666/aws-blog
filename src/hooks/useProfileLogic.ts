import { useState } from 'react';
import { logger } from '@/utils/logger';
import { updateUser } from '../api/user';

export const useProfileLogic = (user: { 
  userId: string;
  lineSettings?: {
    isVerified: boolean;
    id?: string;
  };
}) => {
  const [verificationState, setVerificationState] = useState<{
    step: 'idle' | 'verifying' | 'confirming' | 'complete';
    code?: string;
  }>({ step: 'idle' });

  const handleLineVerification = async (lineId: string) => {
    logger.info(`開始 LINE ID 驗證流程`, { lineId });
    
    try {
      setVerificationState(prev => ({
        ...prev,
        status: 'validating',
        message: '驗證中...'
      }));
      logger.info('驗證狀態已更新為驗證中');

      // 檢查 LINE ID 格式
      if (!lineId || lineId.trim().length === 0) {
        logger.warn('LINE ID 為空');
        setVerificationState(prev => ({
          ...prev,
          status: 'error',
          message: '請輸入有效的 LINE ID'
        }));
        return;
      }

      logger.info('發送驗證請求到後端');
      const response = await fetch('/api/line/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineId,
          userId: user?.userId
        })
      });

      const data = await response.json();
      logger.info('收到後端驗證響應', {
        status: response.status,
        data
      });

      if (!response.ok) {
        logger.error('驗證請求失敗', {
          status: response.status,
          error: data.error
        });
        setVerificationState(prev => ({
          ...prev,
          status: 'error',
          message: data.error || '驗證失敗，請稍後重試'
        }));
        return;
      }

      logger.info('驗證請求成功，等待用戶確認');
      setVerificationState(prev => ({
        ...prev,
        status: 'success',
        message: '驗證碼已發送，請在 LINE 上確認'
      }));

      // 開始輪詢確認狀態
      logger.info('開始輪詢確認狀態');
      const pollInterval = setInterval(async () => {
        try {
          const checkResponse = await fetch('/api/line/check-follow-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lineId,
              userId: user?.userId
            })
          });

          const checkData = await checkResponse.json();
          logger.info('輪詢狀態響應', {
            status: checkResponse.status,
            data: checkData
          });

          if (checkData.isVerified) {
            logger.info('用戶已確認驗證');
            clearInterval(pollInterval);
            setVerificationState(prev => ({
              ...prev,
              status: 'success',
              message: 'LINE 通知已成功開啟'
            }));
            // 更新用戶設定
            updateUser({
              ...user,
              lineSettings: {
                ...(user.lineSettings || {}),
                isVerified: true,
                id: lineId
              }
            });
          }
        } catch (error) {
          logger.error('輪詢過程中發生錯誤', { error });
        }
      }, 5000);

      // 設置超時
      setTimeout(() => {
        clearInterval(pollInterval);
        logger.info('驗證超時');
        setVerificationState(prev => ({
          ...prev,
          status: 'error',
          message: '驗證超時，請重試'
        }));
      }, 300000); // 5分鐘超時

    } catch (error) {
      logger.error('驗證過程發生錯誤', { error });
      setVerificationState(prev => ({
        ...prev,
        status: 'error',
        message: '驗證過程發生錯誤，請稍後重試'
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

  const checkLineFollowStatus = async (lineUserId: string) => {
    try {
      setVerificationState(prev => ({
        ...prev,
        status: 'validating'
      }));
      
      const response = await fetch('/api/line/check-follow-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lineUserId }),
      });

      if (!response.ok) {
        throw new Error('檢查追蹤狀態失敗');
      }

      const data = await response.json();
      
      // 更新狀態處理邏輯
      if (data.isFollowing) {
        setVerificationState(prev => ({
          ...prev,
          isVerified: true,
          status: 'success'
        }));
      } else {
        setVerificationState(prev => ({
          ...prev,
          isVerified: false,
          status: 'error'
        }));
        setVerificationState(prev => ({
          ...prev,
          error: '請先追蹤官方帳號'
        }));
      }
    } catch (error) {
      setVerificationState(prev => ({
        ...prev,
        isVerified: false,
        status: 'error'
      }));
      setVerificationState(prev => ({
        ...prev,
        error: '檢查追蹤狀態時發生錯誤'
      }));
    } finally {
      setVerificationState(prev => ({
        ...prev,
        status: 'idle'
      }));
    }
  };

  return { verificationState, handleLineVerification, confirmVerification, checkLineFollowStatus };
}; 