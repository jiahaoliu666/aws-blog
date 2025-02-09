import { useState, useCallback, useEffect } from 'react';
import { useToastContext } from '@/context/ToastContext';
import { useAuthContext } from '@/context/AuthContext';
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from '@/utils/dynamodb';
import { faSave } from '@fortawesome/free-solid-svg-icons';
import logActivity from '@/pages/api/profile/activity-log';

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
  clearPreferences: () => void;
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
  const { showToast } = useToastContext();

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
        const newPreferences = {
          theme: response.Item.theme || 'light',
          language: response.Item.language || 'zh-TW',
          viewMode: response.Item.viewMode || 'grid',
          autoSummarize: response.Item.autoSummarize || false
        };
        setPreferences(newPreferences);
        
        // 將資料庫的設定同步到 localStorage，並加入時間戳
        const storageData = {
          ...newPreferences,
          timestamp: Date.now(),
          userId: authUser.id
        };
        localStorage.setItem('userPreferences', JSON.stringify(storageData));
      }
    } catch (err) {
      console.error('讀取偏好設定失敗:', err);
      // 如果讀取資料庫失敗，嘗試從 localStorage 讀取
      const localPreferences = localStorage.getItem('userPreferences');
      if (localPreferences) {
        try {
          const parsed = JSON.parse(localPreferences);
          // 檢查時間戳和用戶ID是否匹配
          if (parsed.userId === authUser.id && 
              Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) { // 24小時內的緩存
            const { theme, language, viewMode, autoSummarize } = parsed;
            setPreferences({ theme, language, viewMode, autoSummarize });
          } else {
            // 清除過期或不匹配的緩存
            localStorage.removeItem('userPreferences');
          }
        } catch (e) {
          console.error('解析本地設定失敗:', e);
          localStorage.removeItem('userPreferences');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [authUser?.id]);

  // 處理設定變更
  const handleSettingChange = useCallback((key: string, value: any) => {
    console.log('設定變更:', key, value);
    setPreferences(prev => {
      const newPreferences = {
        ...prev,
        [key]: value
      };
      // 暫時保存到 localStorage
      localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
      return newPreferences;
    });
  }, []);

  // 更新設定到資料庫
  const updatePreferences = useCallback(async (newSettings: PreferenceSettings & { userId: string }) => {
    if (!newSettings.userId) {
      showToast('無法儲存設定', 'error', {
        description: '找不到用戶ID，請重新登入'
      });
      return Promise.reject(new Error('找不到用戶ID'));
    }

    setIsLoading(true);
    showToast('正在儲存...', 'loading');

    try {
      const updateData = {
        userId: newSettings.userId,
        theme: newSettings.theme,
        language: newSettings.language,
        viewMode: newSettings.viewMode,
        autoSummarize: newSettings.autoSummarize,
        updatedAt: new Date().toISOString()
      };

      // 先更新本地存儲
      const storageData = {
        ...updateData,
        timestamp: Date.now()
      };
      localStorage.setItem('userPreferences', JSON.stringify(storageData));

      // 轉換設定值為中文的函數
      const getThemeText = (theme: string) => theme === 'light' ? '淺色' : '深色';
      const getLanguageText = (lang: string) => {
        const normalizedLang = lang.includes('-') ? lang : `${lang}-US`;
        const langMap: { [key: string]: string } = {
          'zh-TW': '繁體中文',
          'en-US': '英文',
          'en': '英文',     
          'zh': '繁體中文', 
        };
        return langMap[normalizedLang] || langMap[lang] || lang;
      };
      const getViewModeText = (mode: string) => mode === 'grid' ? '網格' : '列表';
      const getBooleanText = (value: boolean) => value ? '開啟' : '關閉';

      // 比較變更的設定
      const changes = [];
      if (preferences.theme !== newSettings.theme) {
        changes.push(`主題模式：${getThemeText(preferences.theme)} → ${getThemeText(newSettings.theme)}`);
      }
      if (preferences.language !== newSettings.language) {
        changes.push(`顯示語言：${getLanguageText(preferences.language)} → ${getLanguageText(newSettings.language)}`);
      }
      if (preferences.viewMode !== newSettings.viewMode) {
        changes.push(`檢視模式：${getViewModeText(preferences.viewMode)} → ${getViewModeText(newSettings.viewMode)}`);
      }
      if (preferences.autoSummarize !== newSettings.autoSummarize) {
        changes.push(`一鍵總結：${getBooleanText(preferences.autoSummarize)} → ${getBooleanText(newSettings.autoSummarize)}`);
      }

      // 更新資料庫
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: updateData
      }));

      // 記錄變更的設定
      if (changes.length > 0) {
        const changeLog = `更新個人偏好設定：${changes.join('、')}`;
        await logActivity(newSettings.userId, changeLog);
      }

      setPreferences(newSettings);
      showToast('設定已更新成功！', 'success');

    } catch (err) {
      console.error('更新偏好設定失敗:', err);
      showToast('更新設定失敗，請稍後再試', 'error');
      // 發生錯誤時，清除本地存儲以避免不一致
      localStorage.removeItem('userPreferences');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [showToast, preferences]);

  // 清除偏好設定
  const clearPreferences = useCallback(() => {
    localStorage.removeItem('userPreferences');
    setPreferences({
      theme: 'light',
      language: 'zh-TW',
      viewMode: 'grid',
      autoSummarize: false
    });
  }, []);

  // 監聽登出事件
  useEffect(() => {
    const handleLogout = () => {
      clearPreferences();
    };

    window.addEventListener('logout', handleLogout);
    return () => {
      window.removeEventListener('logout', handleLogout);
    };
  }, [clearPreferences]);

  // 初始載入設定
  useEffect(() => {
    console.log('初始化設定...');
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    updatePreferences,
    handleSettingChange,
    isLoading,
    clearPreferences
  };
}; 