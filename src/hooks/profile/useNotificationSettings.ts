import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useNotificationSettings = (userId: string) => {
  const queryClient = useQueryClient();

  // 獲取設定
  const { data: settings, isLoading } = useQuery({
    queryKey: ['notificationSettings', userId],
    queryFn: async () => {
      const response = await fetch(`/api/notifications/settings?userId=${userId}`);
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5分鐘內不重新獲取
  });

  // 更新設定
  const { mutate: updateSettings } = useMutation({
    mutationFn: async (newSettings: { userId: string; [key: string]: any }) => {
      console.info('開始更新通知設定', { 
        userId: newSettings.userId,
        settings: newSettings,
        timestamp: new Date().toISOString()
      });

      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('更新通知設定失敗', {
          status: response.status,
          error: errorData,
          timestamp: new Date().toISOString()
        });
        throw new Error(errorData.error || '更新設定失敗');
      }

      console.info('通知設定更新成功', {
        userId: newSettings.userId,
        timestamp: new Date().toISOString()
      });
      return response.json();
    },
    onSuccess: () => {
      console.info('快取已更新', {
        queryKey: ['notificationSettings', userId],
        timestamp: new Date().toISOString()
      });
      queryClient.invalidateQueries({
        queryKey: ['notificationSettings', userId],
      });
    },
    onError: (error) => {
      console.error('更新設定時發生錯誤', {
        error: error instanceof Error ? error.message : '未知錯誤',
        userId,
        timestamp: new Date().toISOString()
      });
    }
  });

  // 新增 handleSettingChange 方法
  const handleSettingChange = async (key: string, value: any) => {
    if (!userId) return;
    
    try {
      await updateSettings({
        userId,
        [key]: value
      });
    } catch (error) {
      console.error('設定更新失敗:', error);
      throw error;
    }
  };

  // 新增批量更新設定的方法
  const saveAllSettings = async (settings: { [key: string]: any }) => {
    if (!userId) return;
    
    try {
      await updateSettings({
        userId,
        ...settings
      });
    } catch (error) {
      console.error('批量更新設定失敗:', error);
      throw error;
    }
  };

  return { settings, isLoading, updateSettings, handleSettingChange, saveAllSettings };
};

// 定義 UseProfileNotificationsReturn 型別的內容
export type UseProfileNotificationsReturn = {
  settings: any; // 根據實際資料結構替換 'any'
  isLoading: boolean;
  updateSettings: (newSettings: { userId: string; [key: string]: any }) => void;
  handleSettingChange: (key: string, value: any) => void;
  saveAllSettings: (settings: { [key: string]: any }) => void;
};

export const useProfileNotifications = () => {
  // 實作 useProfileNotifications 的邏輯
};