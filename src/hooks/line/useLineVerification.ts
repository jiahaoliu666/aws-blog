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
  const [lineId, setLineId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const dynamoClient = new DynamoDBClient({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const handleVerification = async () => {
    if (!lineId.trim()) {
      toast.error('請輸入 LINE ID');
      return;
    }

    if (!lineId.match(/^U[0-9a-f]{32}$/i)) {
      toast.error('請輸入有效的 LINE ID');
      return;
    }

    try {
      setIsVerifying(true);

      // 儲存 LINE ID 到 DynamoDB
      const params = {
        TableName: "AWS_Blog_UserNotificationSettings",
        Item: {
          userId: { S: user?.sub || '' },
          lineId: { S: lineId },
          isVerified: { BOOL: true },
          updatedAt: { S: new Date().toISOString() }
        }
      };

      await dynamoClient.send(new PutItemCommand(params));

      await updateUserLineSettings({
        lineId,
        isVerified: true
      });

      toast.success('LINE ID 已成功儲存');
      setLineId('');
    } catch (error) {
      logger.error('儲存 LINE ID 失敗:', error);
      toast.error('儲存失敗，請稍後重試');
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    lineId,
    setLineId,
    isVerifying,
    handleVerification
  };
};

export type UseLineVerificationReturn = {
  // 在這裡定義您的型別
}; 