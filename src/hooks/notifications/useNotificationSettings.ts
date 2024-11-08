import { useState } from 'react';
import { toast } from 'react-toastify';
import { logger } from '@/utils/logger';
import { User } from '@/types/userType';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

interface NotificationSettings {
  emailNotification: boolean;
  browser?: boolean;
  mobile?: boolean;
  line?: boolean;
}

interface UseNotificationSettingsProps {
  user: User | null;
  formData: any;
}

export const useNotificationSettings = ({ user, formData }: UseNotificationSettingsProps) => {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotification: false,
    browser: false,
    mobile: false,
    line: false
  });
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsStatus, setSettingsStatus] = useState<'success' | 'error' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const dynamoClient = new DynamoDBClient({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const updateNotificationSettings = async ({
    userId,
    emailNotification = true,
    email = ''
  }: {
    userId?: string;
    emailNotification?: boolean;
    email?: string;
  }) => {
    try {
      if (!userId) {
        throw new Error('找不到用戶ID');
      }

      const params = {
        TableName: 'AWS_Blog_UserNotificationSettings',
        Item: {
          userId: { S: userId },
          emailNotification: { BOOL: emailNotification },
          email: { S: email },
          updatedAt: { S: new Date().toISOString() }
        }
      };

      const command = new PutItemCommand(params);
      await dynamoClient.send(command);

      return { success: true };
    } catch (error) {
      logger.error('更新通知設定失敗:', error);
      throw error;
    }
  };

  const handleSaveNotificationSettings = async (userId?: string) => {
    try {
      if (!userId) {
        toast.error('找不到用戶ID');
        setSettingsMessage('找不到用戶ID');
        setSettingsStatus('error');
        return;
      }

      const currentEmailNotification = formData.notifications.email;
      const originalEmailNotification = notificationSettings.emailNotification;
      const hasChanges = currentEmailNotification !== originalEmailNotification;

      if (!hasChanges) {
        toast.info('沒有任何設定變更');
        setSettingsMessage('沒有任何設定變更');
        setSettingsStatus('error');
        return;
      }

      setIsLoading(true);
      
      await updateNotificationSettings({
        userId,
        emailNotification: currentEmailNotification,
        email: currentEmailNotification ? formData.email : ''
      });

      toast.success('通知設定已成功更新');
      setSettingsMessage('通知設定已成功更新');
      setSettingsStatus('success');
      
      setNotificationSettings(prev => ({
        ...prev,
        emailNotification: currentEmailNotification
      }));

    } catch (error) {
      console.error('保存通知設定時發生錯誤:', error);
      toast.error('更新通知設定失敗');
      setSettingsMessage('更新通知設定失敗');
      setSettingsStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    notificationSettings,
    settingsMessage,
    settingsStatus,
    isLoading,
    handleSaveNotificationSettings,
    updateNotificationSettings
  };
}; 