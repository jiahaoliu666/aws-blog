import { useState, useCallback, useEffect } from 'react';
import { useToast } from '../toast/useToast';
import { useAuthContext } from '@/context/AuthContext';
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from '@/utils/dynamodb';

const TABLE_NAME = 'AWS_Blog_UserPreferences';

interface PreferenceSettings {
  theme: 'light' | 'dark';
  language: string;
  viewMode: 'grid' | 'list';
  autoSummarize: boolean;
}

export type UseProfilePreferencesReturn = {
  preferences: PreferenceSettings;
  updatePreferences: (newSettings: PreferenceSettings & { userId: string }) => Promise<void>;
  handleSettingChange: (key: string, value: any) => void;
  isLoading: boolean;
};

export const useProfilePreferences = (): UseProfilePreferencesReturn => {
  const { user: authUser } = useAuthContext();
  const [preferences, setPreferences] = useState<PreferenceSettings>({
    theme: 'light',
    language: 'zh-TW',
    viewMode: 'grid',
    autoSummarize: false
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { showToast } = useToast();

  // 讀取設定
  const fetchPreferences = useCallback(async () => {
    if (!authUser?.id) {
      console.log('未登入或無使用者ID，跳過讀取設定');
      return;
    }

    try {
      setIsLoading(true);
      const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          userId: authUser.id
        }
      });

      console.log('正在讀取使用者設定:', authUser.id);
      const response = await docClient.send(command);
      
      if (response.Item) {
        console.log('成功讀取設定:', response.Item);
        setPreferences({
          theme: response.Item.theme || 'light',
          language: response.Item.language || 'zh-TW',
          viewMode: response.Item.viewMode || 'grid',
          autoSummarize: response.Item.autoSummarize || false
        });
      } else {
        console.log('未找到使用者設定，使用預設值');
      }
    } catch (err) {
      console.error('讀取偏好設定失敗:', err);
      showToast('讀取設定失敗', 'error', {
        description: '無法讀取您的偏好設定'
      });
    } finally {
      setIsLoading(false);
    }
  }, [authUser?.id, showToast]);

  // 更新設定
  const updatePreferences = useCallback(async (newSettings: PreferenceSettings & { userId: string }) => {
    if (!authUser?.id && !authUser?.sub) {
      showToast('請先登入', 'error');
      return Promise.reject(new Error('請先登入'));
    }

    setIsLoading(true);
    try {
      const userId = newSettings.userId || authUser.id || authUser.sub;
      console.log('正在更新使用者設定:', userId);

      const updateData = {
        ...newSettings,
        updatedAt: new Date().toISOString()
      };

      console.log('更新資料:', updateData);

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: updateData
      }));

      setPreferences(newSettings);
      localStorage.setItem('userPreferences', JSON.stringify(newSettings));
      showToast('設定已更新', 'success');
      console.log('設定更新成功');
      
    } catch (err) {
      console.error('更新偏好設定失敗:', err);
      showToast('更新失敗', 'error', {
        description: '請確認您的網路連線並重試'
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authUser, showToast]);

  // 處理設定變更
  const handleSettingChange = useCallback((key: string, value: any) => {
    console.log('設定變更:', key, value);
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // 初始載入設定
  useEffect(() => {
    console.log('初始化設定...');
    const localPreferences = localStorage.getItem('userPreferences');
    if (localPreferences) {
      try {
        console.log('從本地儲存讀取設定');
        const parsed = JSON.parse(localPreferences);
        setPreferences(parsed);
      } catch (e) {
        console.error('解析本地設定失敗:', e);
      }
    }
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    updatePreferences,
    handleSettingChange,
    isLoading,
  };
}; 