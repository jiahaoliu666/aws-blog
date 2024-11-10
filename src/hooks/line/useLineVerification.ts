import { useState } from 'react';
import { toast } from 'react-toastify';
import { User } from '@/types/userType';
import { VerificationStep, VerificationStatus } from '@/types/lineTypes';
import { LineUserSettings } from '@/types/lineTypes';
import { logger } from '@/utils/logger';

interface UseLineVerificationProps {
  user: User | null;
  updateUserLineSettings: (settings: Partial<LineUserSettings>) => Promise<void>;
}

export const useLineVerification = ({ user, updateUserLineSettings }: UseLineVerificationProps) => {
  const [lineId, setLineId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationState, setVerificationState] = useState({
    step: VerificationStep.IDLE,
    status: VerificationStatus.PENDING,
    message: '',
    isVerified: false
  });

  // 驗證 LINE ID 格式
  const validateLineId = (id: string): boolean => {
    const lineIdPattern = /^U[0-9a-f]{32}$/i;
    return lineIdPattern.test(id.trim());
  };

  const handleVerification = async () => {
    if (!user?.sub) {
      toast.error('請先登入後再進行驗證');
      return;
    }

    const trimmedLineId = lineId.trim();
    const trimmedCode = verificationCode.trim();

    // 基本驗證
    if (!trimmedLineId || !trimmedCode) {
      toast.error('請填寫 LINE ID 和驗證碼');
      return;
    }

    // 驗證 LINE ID 格式
    if (!validateLineId(trimmedLineId)) {
      toast.error('LINE ID 格式不正確');
      return;
    }

    try {
      setIsVerifying(true);
      setVerificationState(prev => ({
        ...prev,
        status: VerificationStatus.VALIDATING,
        message: '驗證進行中...'
      }));

      const response = await fetch('/api/line/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.sub,
          lineId: trimmedLineId,
          verificationCode: trimmedCode
        })
      });

      const data = await response.json();

      if (data.success) {
        // 驗證成功
        setVerificationState({
          step: VerificationStep.COMPLETE,
          status: VerificationStatus.SUCCESS,
          message: '驗證成功！',
          isVerified: true
        });

        // 更新用戶的 LINE 設定
        await updateUserLineSettings({
          lineId: trimmedLineId,
          isVerified: true
        });

        toast.success('LINE 驗證成功！您現在可以接收通知了');
      } else {
        // 驗證失敗
        setVerificationState(prev => ({
          ...prev,
          status: VerificationStatus.ERROR,
          message: data.message || '驗證失敗'
        }));

        // 根據不同錯誤類型顯示對應訊息
        switch (data.errorCode) {
          case 'INVALID_CODE':
            toast.error('驗證碼不正確，請重新確認');
            break;
          case 'CODE_EXPIRED':
            toast.error('驗證碼已過期，請重新取得驗證碼');
            break;
          case 'NOT_FOUND':
            toast.error('找不到驗證資訊，請確認 LINE ID 是否正確');
            break;
          case 'NOT_FOLLOWING':
            toast.error('請先加入 LINE 官方帳號為好友');
            break;
          default:
            toast.error(data.message || '驗證失敗，請稍後再試');
        }
      }
    } catch (error) {
      logger.error('LINE 驗證過程發生錯誤:', error);
      
      setVerificationState(prev => ({
        ...prev,
        status: VerificationStatus.ERROR,
        message: '系統發生錯誤，請稍後再試'
      }));

      toast.error('系統發生錯誤，請稍後再試');
    } finally {
      setIsVerifying(false);
    }
  };

  const confirmVerification = async (code: string) => {
    try {
      setVerificationState(prev => ({
        ...prev,
        status: VerificationStatus.VALIDATING,
      }));

      const response = await fetch('/api/line/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.sub,
          lineId: user?.lineId,
          code 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setVerificationState({
          step: VerificationStep.COMPLETE,
          status: VerificationStatus.SUCCESS,
          isVerified: true,
          message: '驗證成功！'
        });
      } else {
        throw new Error('驗證失敗');
      }
    } catch (error) {
      setVerificationState(prev => ({
        ...prev,
        status: VerificationStatus.ERROR,
      }));
      throw error;
    }
  };

  return {
    lineId,
    setLineId,
    verificationCode,
    setVerificationCode,
    isVerifying,
    verificationState,
    handleVerification,
    confirmVerification
  };
};

export type UseLineVerificationReturn = {
  // 在這裡定義您的型別
}; 