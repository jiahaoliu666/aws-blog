import { useState, useEffect } from 'react';
import { lineService } from '@/services/lineService';
import { toast } from 'react-toastify';
import { logger } from '@/utils/logger';
import { User } from '@/types/userType';
import { VerificationStep, VerificationStatus, VerificationState } from '@/types/lineTypes';
import docClient from '@/libs/dynamodb';
import { GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

interface UseLineVerificationProps {
  user: User | null;
  updateUserLineSettings: (settings: {
    lineId: string;
    isVerified: boolean;
    verificationStep: VerificationStep;
    verificationStatus: VerificationStatus;
  }) => Promise<void>;
}

const createVerificationTemplate = (code: string) => {
  return `您的驗證碼是：${code}\n請在網頁上輸入此驗證碼完成驗證。`;
};

export const useLineVerification = ({ user, updateUserLineSettings }: UseLineVerificationProps) => {
  const [verificationState, setVerificationState] = useState<VerificationState>({
    step: VerificationStep.IDLE,
    status: VerificationStatus.IDLE,
    message: '',
    isVerified: false,
    progress: 0,
    currentStep: 1
  });
  const [lineId, setLineId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // 檢查驗證狀態
  const checkVerificationStatus = async () => {
    if (!user?.sub) return;
    
    try {
      const response = await fetch(`/api/line/verify/status?userId=${user.sub}`);
      const data = await response.json();
      
      if (data.isVerified) {
        setVerificationState({
          step: VerificationStep.COMPLETE,
          status: VerificationStatus.SUCCESS,
          message: '驗證成功',
          isVerified: true,
          progress: 100,
          currentStep: 4
        });
      }
    } catch (error) {
      logger.error('檢查驗證狀態失敗:', error);
    }
  };

  // 驗證 LINE ID 和驗證碼
  const verifyLineIdAndCode = async (lineId: string, verificationCode: string) => {
    try {
      setVerificationState(prev => ({
        ...prev,
        step: VerificationStep.VERIFYING,
        status: VerificationStatus.VALIDATING,
        message: '正在驗證...',
        currentStep: 3,
        progress: 75
      }));

      setTimeout(() => {
        setVerificationState(prev => ({
          ...prev,
          progress: 60
        }));
      }, 500);

      const params = {
        TableName: "AWS_Blog_UserNotificationSettings",
        Key: {
          lineId: { S: lineId }
        }
      };

      const result = await docClient.send(new GetItemCommand(params));
      
      if (result.Item?.verificationCode?.S === verificationCode) {
        await updateUserLineSettings({
          lineId,
          isVerified: true,
          verificationStep: VerificationStep.COMPLETE,
          verificationStatus: VerificationStatus.SUCCESS
        });

        setVerificationState(prev => ({
          ...prev,
          step: VerificationStep.COMPLETE,
          status: VerificationStatus.SUCCESS,
          message: '驗證成功！',
          currentStep: 4,
          progress: 100
        }));

        toast.success('LINE 帳號驗證成功');
      } else {
        setVerificationState(prev => ({
          ...prev,
          step: VerificationStep.VERIFYING,
          status: VerificationStatus.ERROR,
          message: '驗證碼不正確，請重新確認',
          progress: 0
        }));
        
        toast.error('驗證碼不正確');
      }
    } catch (error) {
      logger.error('驗證失敗:', error);
      setVerificationState(prev => ({
        ...prev,
        step: VerificationStep.VERIFYING,
        status: VerificationStatus.ERROR,
        message: '驗證過程發生錯誤',
        progress: 0
      }));
      toast.error('驗證失敗，請稍後重試');
    }
  };

  useEffect(() => {
    checkVerificationStatus();
  }, [user?.sub]);

  return {
    verificationState,
    lineId,
    setLineId,
    verificationCode,
    setVerificationCode,
    verifyLineIdAndCode
  };
};

export type UseLineVerificationReturn = {
  // 在這裡定義您的型別
}; 