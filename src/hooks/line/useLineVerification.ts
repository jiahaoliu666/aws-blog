import { useState } from 'react';
import { lineService } from '@/services/lineService';
import { toast } from 'react-toastify';
import { logger } from '@/utils/logger';
import { User } from '@/types/userType';
import { VerificationStep, VerificationStatus, VerificationState } from '@/types/lineTypes';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

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
    if (!lineId.trim() || !verificationCode.trim()) {
      toast.error('請輸入 LINE ID 和驗證碼');
      return;
    }

    try {
      setIsVerifying(true);
      setVerificationState(prev => ({
        ...prev,
        status: VerificationStatus.VALIDATING
      }));

      const response = await fetch('/api/line/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.sub,
          lineId,
          verificationCode
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
          lineId,
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

  return {
    verificationState,
    lineId,
    setLineId,
    verificationCode,
    setVerificationCode,
    isVerifying,
    handleVerification
  };
};

export type UseLineVerificationReturn = {
  // 在這裡定義您的型別
}; 