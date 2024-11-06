import { useState } from 'react';
import { logger } from '@/utils/logger';
import { updateUser } from '../api/user';
import { toast } from 'react-toastify';

type VerificationState = {
  step: 'idle' | 'verifying' | 'confirming' | 'complete';
  status: 'idle' | 'validating' | 'pending' | 'error' | 'success';
  message?: string;
  isVerified?: boolean;
  error?: string;
};

export const useProfileLogic = (user: { 
  userId: string;
  lineSettings?: {
    isVerified: boolean;
    id?: string;
  };
}) => {
  const [verificationState, setVerificationState] = useState<VerificationState>({
    step: 'idle',
    status: 'idle',
    message: ''
  });

  const handleLineVerification = async (lineId: string) => {
    try {
      // 1. 初始驗證
      setVerificationState({
        step: 'verifying',
        status: 'validating',
        message: '正在驗證 LINE ID...'
      });

      // 2. 格式驗證
      if (!lineId.match(/^U[a-zA-Z0-9]{32}$/)) {
        throw new Error('LINE ID 格式不正確，請確認是否完整複製 ID');
      }

      // 3. 檢查追蹤狀態
      const followStatus = await checkLineFollowStatus(lineId);
      if (!followStatus.isFollowing) {
        setVerificationState({
          step: 'idle',
          status: 'error',
          message: '請先加入官方帳號為好友，再進行驗證'
        });
        return;
      }

      // 4. 發送驗證請求
      setVerificationState({
        step: 'verifying',
        status: 'validating',
        message: '正在發送驗證碼...'
      });

      const response = await fetch('/api/line/verify/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineId, userId: user.userId })
      });

      if (!response.ok) {
        throw new Error('驗證碼發送失敗，請稍後再試');
      }

      // 5. 等待用戶確認
      setVerificationState({
        step: 'confirming',
        status: 'pending',
        message: '驗證碼已發送至您的 LINE，請查收並在下方輸入'
      });

    } catch (error) {
      setVerificationState({
        step: 'idle',
        status: 'error',
        message: error instanceof Error ? error.message : '驗證過程發生錯誤'
      });
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

      setVerificationState({ 
        step: 'complete',
        status: 'success'
      });
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
      
      // 更新狀態
      setVerificationState(prev => ({
        ...prev,
        isVerified: data.isFollowing,
        status: data.isFollowing ? 'success' : 'error',
        error: data.isFollowing ? undefined : '請先追蹤官方帳號'
      }));

      return { isFollowing: data.isFollowing };
    } catch (error) {
      setVerificationState(prev => ({
        ...prev,
        isVerified: false,
        status: 'error',
        error: '檢查追蹤狀態時發生錯誤'
      }));
      return { isFollowing: false };
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
        setVerificationState({ 
          step: 'complete',
          status: 'success'
        });
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