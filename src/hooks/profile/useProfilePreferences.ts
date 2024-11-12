import { useState, useCallback, useEffect } from 'react';
import { useToast } from '../toast/useToast';
import { useAuthContext } from '@/context/AuthContext';
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from '@/utils/dynamodb';
import { faSave } from '@fortawesome/free-solid-svg-icons';

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
    console.log('開始更新設定，收到的設定值:', newSettings);
    
    if (!newSettings.userId) {
      console.error('未找到用戶ID');
      showToast('無法儲存設定', 'error', {
        description: '找不到用戶ID，請重新登入',
        position: 'top-right',
        duration: 3000
      });
      return Promise.reject(new Error('找不到用戶ID'));
    }

    setIsLoading(true);
    try {
      const updateData = {
        userId: newSettings.userId,
        theme: newSettings.theme,
        language: newSettings.language,
        viewMode: newSettings.viewMode,
        autoSummarize: newSettings.autoSummarize,
        updatedAt: new Date().toISOString()
      };

      console.log('準備發送到 DynamoDB 的數據:', updateData);

      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: updateData
      }));

      setPreferences(newSettings);
      localStorage.setItem('userPreferences', JSON.stringify(newSettings));
      
      showToast('設定已更新', 'success', {
        description: '您的偏好設定已成功儲存',
        position: 'top-right',
        duration: 3000,
        icon: faSave
      });
      
    } catch (err) {
      console.error('更新偏好設定失敗，詳細錯誤:', err);
      showToast('更新失敗', 'error', {
        description: '設定更新失敗，請稍後再試',
        position: 'top-right',
        duration: 4000
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // 處理設定變更
  const handleSettingChange = useCallback((key: string, value: any) => {
    console.log('設定變更:', key, value);
    setPreferences(prev => {
      const newPreferences = {
        ...prev,
        [key]: value
      };
      console.log('更新後的設定狀態:', newPreferences);
      return newPreferences;
    });
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