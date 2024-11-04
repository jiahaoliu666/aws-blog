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
    mutationFn: async (newSettings) => {
      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        body: JSON.stringify(newSettings),
      });
      return response.json();
    },
    onSuccess: () => {
      // 更新快取
      queryClient.invalidateQueries({
        queryKey: ['notificationSettings', userId],
      });
    },
  });

  return { settings, isLoading, updateSettings };
}; 