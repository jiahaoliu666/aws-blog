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
    console.log('開始 LINE ID 驗證流程', { lineId });
    
    try {
      setVerificationState(prev => ({
        ...prev,
        step: 'verifying',
        status: 'validating',
        message: '驗證中...'
      }));

      // 檢查 LINE ID 格式
      if (!lineId || lineId.trim().length === 0) {
        throw new Error('請輸入有效的 LINE ID');
      }

      // 先檢查追蹤狀態
      const followResponse = await fetch('/api/line/check-follow-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineId,
          userId: user?.userId
        })
      });

      const followData = await followResponse.json();
      
      if (!followData.isFollowing) {
        throw new Error('請先追蹤官方帳號後再進行驗證');
      }

      // 發送驗證請求
      const response = await fetch('/api/line/verify/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineId,
          userId: user?.userId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '驗證請求失敗');
      }

      setVerificationState(prev => ({
        ...prev,
        step: 'confirming',
        code: data.verificationCode,
        message: '請在 LINE 上確認驗證碼'
      }));

      // 開始輪詢確認狀態
      startPolling(lineId);

    } catch (error) {
      console.error('驗證過程發生錯誤:', error);
      setVerificationState(prev => ({
        ...prev,
        step: 'idle',
        status: 'error',
        message: error instanceof Error ? error.message : '驗證過程發生錯誤'
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

  const startPolling = async (lineId: string) => {
    const checkStatus = async () => {
      const response = await fetch('/api/line/verify/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineId, userId: user.userId })
      });
      const data = await response.json();
      
      if (data.isVerified) {
        setVerificationState({ step: 'complete' });
        return true;
      }
      return false;
    };

    let attempts = 0;
    const maxAttempts = 10;
    
    const poll = async () => {
      if (attempts >= maxAttempts) return;
      
      const isComplete = await checkStatus();
      if (!isComplete) {
        attempts++;
        setTimeout(poll, 3000); // 每3秒檢查一次
      }
    };

    poll();
  };

  return { verificationState, handleLineVerification, confirmVerification, checkLineFollowStatus };
}; 