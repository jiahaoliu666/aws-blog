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

  return { settings, isLoading, updateSettings };
}; 