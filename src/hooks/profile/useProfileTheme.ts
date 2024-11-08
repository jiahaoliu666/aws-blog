import { useState, useEffect } from 'react';
import { DynamoDBClient, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { User } from '@/types/userType';
import { logger } from '@/utils/logger';
import { toast } from 'react-toastify';

interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  primaryColor: string;
  isCompactLayout: boolean;
  animations: boolean;
  customStyles?: {
    fontFamily?: string;
    borderRadius?: string;
    spacing?: string;
  };
}

interface UseProfileThemeProps {
  user: User | null;
}

export const useProfileTheme = ({ user }: UseProfileThemeProps) => {
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    mode: 'system',
    fontSize: 'medium',
    primaryColor: '#1a73e8',
    isCompactLayout: false,
    animations: true,
    customStyles: {
      fontFamily: 'system-ui',
      borderRadius: '8px',
      spacing: 'normal'
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const dynamoClient = new DynamoDBClient({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });

  // 從 localStorage 載入主題設定
  const loadThemeFromStorage = () => {
    try {
      const savedTheme = localStorage.getItem('themeSettings');
      if (savedTheme) {
        setThemeSettings(JSON.parse(savedTheme));
      }
    } catch (error) {
      logger.error('從 localStorage 載入主題設定失敗:', error);
    }
  };

  // 從資料庫載入主題設定
  const fetchThemeSettings = async () => {
    if (!user?.sub) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = {
        TableName: 'AWS_Blog_UserThemeSettings',
        Key: {
          userId: { S: user.sub }
        }
      };

      const command = new GetItemCommand(params);
      const response = await dynamoClient.send(command);

      if (response.Item) {
        const settings: ThemeSettings = {
          mode: response.Item.mode.S as ThemeSettings['mode'],
          fontSize: response.Item.fontSize.S as ThemeSettings['fontSize'],
          primaryColor: response.Item.primaryColor.S!,
          isCompactLayout: response.Item.isCompactLayout.BOOL!,
          animations: response.Item.animations.BOOL!,
          customStyles: response.Item.customStyles?.M ? {
            fontFamily: response.Item.customStyles.M.fontFamily?.S,
            borderRadius: response.Item.customStyles.M.borderRadius?.S,
            spacing: response.Item.customStyles.M.spacing?.S
          } : undefined
        };

        setThemeSettings(settings);
        localStorage.setItem('themeSettings', JSON.stringify(settings));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '載入主題設定失敗';
      setError(new Error(errorMessage));
      logger.error('載入主題設定失敗:', error);
      toast.error('無法載入主題設定');
    } finally {
      setIsLoading(false);
    }
  };

  // 儲存主題設定
  const saveThemeSettings = async (newSettings: Partial<ThemeSettings>) => {
    if (!user?.sub) return;

    try {
      setIsLoading(true);
      setError(null);

      const updatedSettings = {
        ...themeSettings,
        ...newSettings
      };

      const params = {
        TableName: 'AWS_Blog_UserThemeSettings',
        Key: {
          userId: { S: user.sub }
        },
        UpdateExpression: 'SET mode = :mode, fontSize = :fontSize, primaryColor = :primaryColor, isCompactLayout = :isCompactLayout, animations = :animations, customStyles = :customStyles, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':mode': { S: updatedSettings.mode },
          ':fontSize': { S: updatedSettings.fontSize },
          ':primaryColor': { S: updatedSettings.primaryColor },
          ':isCompactLayout': { BOOL: updatedSettings.isCompactLayout },
          ':animations': { BOOL: updatedSettings.animations },
          ':customStyles': {
            M: {
              fontFamily: { S: updatedSettings.customStyles?.fontFamily || 'system-ui' },
              borderRadius: { S: updatedSettings.customStyles?.borderRadius || '8px' },
              spacing: { S: updatedSettings.customStyles?.spacing || 'normal' }
            }
          },
          ':updatedAt': { S: new Date().toISOString() }
        }
      };

      const command = new UpdateItemCommand(params);
      await dynamoClient.send(command);

      setThemeSettings(updatedSettings);
      localStorage.setItem('themeSettings', JSON.stringify(updatedSettings));
      
      // 應用主題變更
      applyTheme(updatedSettings);
      
      toast.success('主題設定已更新');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '儲存主題設定失敗';
      setError(new Error(errorMessage));
      logger.error('儲存主題設定失敗:', error);
      toast.error('無法儲存主題設定');
    } finally {
      setIsLoading(false);
    }
  };

  // 應用主題設定
  const applyTheme = (settings: ThemeSettings) => {
    const root = document.documentElement;
    
    // 設置主題模式
    if (settings.mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', settings.mode);
    }

    // 設置字體大小
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[settings.fontSize]);

    // 設置主色調
    root.style.setProperty('--primary-color', settings.primaryColor);

    // 設置佈局
    document.body.classList.toggle('compact-layout', settings.isCompactLayout);

    // 設置動畫
    document.body.classList.toggle('disable-animations', !settings.animations);

    // 設置自定義樣式
    if (settings.customStyles) {
      root.style.setProperty('--font-family', settings.customStyles.fontFamily!);
      root.style.setProperty('--border-radius', settings.customStyles.borderRadius!);
      root.style.setProperty('--spacing', settings.customStyles.spacing!);
    }
  };

  // 監聽系統主題變更
  const setupSystemThemeListener = () => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (themeSettings.mode === 'system') {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  };

  // 重置主題設定
  const resetThemeSettings = async () => {
    const defaultSettings: ThemeSettings = {
      mode: 'system',
      fontSize: 'medium',
      primaryColor: '#1a73e8',
      isCompactLayout: false,
      animations: true,
      customStyles: {
        fontFamily: 'system-ui',
        borderRadius: '8px',
        spacing: 'normal'
      }
    };

    await saveThemeSettings(defaultSettings);
  };

  useEffect(() => {
    loadThemeFromStorage();
    if (user?.sub) {
      fetchThemeSettings();
    }
  }, [user?.sub]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      applyTheme(themeSettings);
      return setupSystemThemeListener();
    }
  }, [themeSettings]);

  return {
    themeSettings,
    isLoading,
    error,
    saveThemeSettings,
    resetThemeSettings,
    applyTheme
  };
}; 