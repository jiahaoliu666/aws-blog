import { useState } from 'react';
import { toast } from 'react-toastify';
import { User } from '@/types/userType';
import { VerificationStep, VerificationStatus, VerificationState } from '@/types/lineTypes';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

interface UseLineVerificationProps {
  user: User | null;
  updateUserLineSettings: (settings: {
    lineId: string;
    isVerified: boolean;
  }) => Promise<void>;
}

export const useLineVerification = ({ user, updateUserLineSettings }: UseLineVerificationProps) => {
  const [verificationState, setVerificationState] = useState<VerificationState>({
    step: VerificationStep.IDLE,
    status: VerificationStatus.IDLE,
    isVerified: false,
    message: '',
    progress: 0,
    currentStep: 1
  });
  const [lineId, setLineId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const dynamoClient = new DynamoDBClient({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const handleVerification = async () => {
    if (!user?.sub) {
      toast.error('請先登入');
      return;
    }

    const trimmedLineId = lineId.trim();
    const trimmedVerificationCode = verificationCode.trim();

    if (!trimmedLineId || !trimmedVerificationCode) {
      toast.error('請輸入 LINE ID 和驗證碼');
      return;
    }

    try {
      setIsVerifying(true);
      setVerificationState(prev => ({
        ...prev,
        status: VerificationStatus.VALIDATING,
        message: '驗證中...'
      }));

      const response = await fetch('/api/line/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.sub,
          lineId: trimmedLineId,
          verificationCode: trimmedVerificationCode
        })
      });

      const data = await response.json();

      if (data.success) {
        setVerificationState(prev => ({
          ...prev,
          step: VerificationStep.COMPLETE,
          status: VerificationStatus.SUCCESS,
          isVerified: true,
          message: '驗證成功！'
        }));
        
        await updateUserLineSettings({
          lineId: trimmedLineId,
          isVerified: true
        });
        
        toast.success('LINE 驗證成功！');
      } else {
        setVerificationState(prev => ({
          ...prev,
          status: VerificationStatus.ERROR,
          message: data.message || '驗證失敗'
        }));
        toast.error(data.message || '驗證失敗');
      }
    } catch (error) {
      setVerificationState(prev => ({
        ...prev,
        status: VerificationStatus.ERROR,
        message: '驗證過程發生錯誤'
      }));
      toast.error('驗證過程發生錯誤');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLineIdChange = (value: string) => {
    setLineId(value);
  };

  const handleVerificationCodeChange = (value: string) => {
    setVerificationCode(value);
  };

  return {
    verificationState,
    lineId,
    setLineId: handleLineIdChange,
    verificationCode,
    setVerificationCode: handleVerificationCodeChange,
    isVerifying,
    handleVerification
  };
};

export type UseLineVerificationReturn = {
  // 在這裡定義您的型別
}; 