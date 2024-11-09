import { useState, useEffect, useRef } from 'react';
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { User } from '@/types/userType';
import { LineUserSettings } from '@/types/lineTypes';
import { lineService } from '@/services/lineService';
import { toast } from 'react-toastify';
import { logger } from '@/utils/logger';

interface UseLineSettingsProps {
  user: User | null;
}

export const useLineSettings = ({ user }: UseLineSettingsProps) => {
  const initialized = useRef(false);

  const [lineUserId, setLineUserId] = useState('');
  const [lineIdError, setLineIdError] = useState('');
  const [lineIdStatus, setLineIdStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [isLineFollowed, setIsLineFollowed] = useState(false);
  const [settings, setSettings] = useState<LineUserSettings | null>(null);

  const dynamoClient = new DynamoDBClient({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      fetchLineSettings();
    }
  }, []);

  // 檢查 LINE 好友狀態
  const checkLineFollowStatus = async () => {
    try {
      if (!lineUserId) {
        toast.error('請先輸入 LINE ID');
        return;
      }

      if (user?.sub) {
        const response = await lineService.checkFollowStatus(lineUserId);
        setIsLineFollowed(response.isFollowing);
        
        if (response.isFollowing) {
          setLineIdStatus('success');
          toast.success('已確認為 LINE 好友');
        } else {
          setLineIdStatus('error');
          toast.error('請先加入 LINE 官方帳號為好友');
        }
      }
    } catch (error) {
      logger.error('檢查 LINE 好友狀態失敗:', error);
      setLineIdStatus('error');
      toast.error('檢查 LINE 好友狀態失敗');
    }
  };

  // 獲取 LINE 設定
  const fetchLineSettings = async () => {
    if (!user?.sub) return;

    try {
      const params = {
        TableName: 'AWS_Blog_UserLineSettings',
        Key: {
          userId: { S: user.sub }
        }
      };

      const command = new GetItemCommand(params);
      const response = await dynamoClient.send(command);

      if (response.Item) {
        const lineSettings: LineUserSettings = {
          userId: user.sub,
          lineId: response.Item.lineId?.S || '',
          isVerified: response.Item.isVerified?.BOOL || false,
          displayName: response.Item.displayName?.S || '',
          isFollowing: response.Item.isFollowing?.BOOL || false,
          notificationPreferences: {
            news: response.Item.notificationPreferences?.M?.news?.BOOL || false,
            announcements: response.Item.notificationPreferences?.M?.announcements?.BOOL || false
          },
          createdAt: response.Item.createdAt?.S || new Date().toISOString(),
          updatedAt: response.Item.updatedAt?.S || new Date().toISOString()
        };
        
        setSettings(lineSettings);
        setLineUserId(lineSettings.lineId);
      }
    } catch (error) {
      logger.error('獲取 LINE 設定失敗:', error);
    }
  };

  // 更新 LINE 設定
  const updateLineSettings = async (newSettings: Partial<LineUserSettings>) => {
    if (!user?.sub) {
      toast.error('找不到用戶ID');
      return;
    }

    try {
      const params = {
        TableName: 'AWS_Blog_UserLineSettings',
        Item: {
          userId: { S: user.sub },
          lineId: { S: newSettings.lineId || settings?.lineId || '' },
          isVerified: { BOOL: newSettings.isVerified ?? settings?.isVerified ?? false },
          displayName: { S: newSettings.displayName || settings?.displayName || '' },
          notificationPreferences: { 
            M: {  // 添加 M (Map) 類型
              news: { BOOL: newSettings.notificationPreferences?.news ?? settings?.notificationPreferences?.news ?? false },
              announcements: { BOOL: newSettings.notificationPreferences?.announcements ?? settings?.notificationPreferences?.announcements ?? false }
            }
          },
          updatedAt: { S: new Date().toISOString() }
        }
      };

      const command = new PutItemCommand(params);
      await dynamoClient.send(command);

      setSettings(prev => ({
        ...prev,
        ...newSettings
      } as LineUserSettings));

      toast.success('LINE 設定已更新');
    } catch (error) {
      logger.error('更新 LINE 設定失敗:', error);
      toast.error('更新 LINE 設定失敗');
    }
  };

  // 驗證 LINE ID 格式
  const validateLineId = (id: string): boolean => {
    const lineIdPattern = /^U[0-9a-f]{32}$/i;
    return lineIdPattern.test(id);
  };

  // 處理 LINE ID 變更
  const handleLineIdChange = (id: string) => {
    setLineUserId(id);
    if (id && !validateLineId(id)) {
      setLineIdError('無效的 LINE ID 格式');
      setLineIdStatus('error');
    } else {
      setLineIdError('');
      setLineIdStatus('idle');
    }
  };

  return {
    lineUserId,
    lineIdError,
    lineIdStatus,
    isLineFollowed,
    settings,
    setLineUserId,
    setLineIdStatus,
    checkLineFollowStatus,
    updateLineSettings,
    handleLineIdChange,
    validateLineId
  };
};

export type UseLineSettingsReturn = {
  settings: LineUserSettings;
  updateSettings: (newSettings: Partial<LineUserSettings>) => Promise<void>;
  // 其他相關的回傳值
}; 