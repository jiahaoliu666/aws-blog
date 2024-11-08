import { useState, useEffect } from 'react';
import { lineService } from '@/services/lineService';
import { toast } from 'react-toastify';
import { logger } from '@/utils/logger';
import { User } from '@/types/userType';
import { VerificationState } from '@/types/lineTypes';
import docClient from '@/libs/dynamodb';
import { GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

enum VerificationStep {
  IDLE = 'idle',
  VERIFYING = 'verifying',
  CONFIRMING = 'confirming',
  COMPLETE = 'complete'
}

enum VerificationStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  VALIDATING = 'validating',
  SUCCESS = 'success',
  ERROR = 'error'
}

interface UseLineVerificationProps {
  user: User | null;
  updateUserLineSettings: (settings: any) => Promise<void>;
}

const createVerificationTemplate = (code: string) => {
  return `您的驗證碼是：${code}\n請在網頁上輸入此驗證碼完成驗證。`;
};

export const useLineVerification = ({ user, updateUserLineSettings }: UseLineVerificationProps) => {
  const [verificationState, setVerificationState] = useState<VerificationState>({
    step: 'idle',
    status: 'idle',
    message: '',
    isVerified: false
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
          step: 'complete',
          status: 'success',
          message: '驗證成功',
          isVerified: true
        });
      }
    } catch (error) {
      logger.error('檢查驗證狀態失敗:', error);
    }
  };

  // 驗證 LINE ID 和驗證碼
  const verifyLineIdAndCode = async (lineId: string, verificationCode: string) => {
    try {
      setVerificationState({
        step: 'verifying',
        status: 'validating',
        message: '正在驗證...'
      });

      // 檢查 DynamoDB 中的驗證碼
      const params = {
        TableName: "AWS_Blog_UserNotificationSettings",
        Key: {
          lineId: { S: lineId }
        }
      };

      const result = await docClient.send(new GetItemCommand(params));
      
      if (result.Item?.verificationCode?.S === verificationCode) {
        // 驗證成功，更新狀態
        await updateUserLineSettings({
          lineId,
          isVerified: true,
          verificationStep: 'complete',
          verificationStatus: 'success'
        });

        setVerificationState({
          step: 'complete',
          status: 'success',
          message: '驗證成功！'
        });

        toast.success('LINE 帳號驗證成功');
      } else {
        setVerificationState({
          step: 'verifying',
          status: 'error',
          message: '驗證碼不正確，請重新確認'
        });
        
        toast.error('驗證碼不正確');
      }
    } catch (error) {
      logger.error('驗證失敗:', error);
      setVerificationState({
        step: 'verifying',
        status: 'error',
        message: '驗證過程發生錯誤'
      });
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