import NodeCache from 'node-cache';
import { Redis } from 'ioredis';
import { useQueryClient } from '@tanstack/react-query';
export const verificationCache = new NodeCache({
    stdTTL: 600, // 10分鐘過期
    checkperiod: 60
});
export const lineStatusCache = new NodeCache({
    stdTTL: 300, // 5分鐘過期
    checkperiod: 30
});
export const invalidateCache = async (userId) => {
    // 清除本地快取
    localStorage.removeItem('userSettings');
    localStorage.removeItem('settingsCacheTimestamp');
    // 清除 Redis 快取
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        throw new Error('REDIS_URL 未定義');
    }
    const redis = new Redis(redisUrl);
    await redis.del(`settings:${userId}`);
    // 清除 LINE 狀態快取
    lineStatusCache.del(`lineStatus:${userId}`);
    // 獲取 queryClient 實例
    const queryClient = useQueryClient();
    // 通知 React Query 重新獲取數據
    queryClient.invalidateQueries({
        queryKey: ['notificationSettings', userId]
    });
};
// 在設定更新時調用
export const handleSettingsUpdate = async (userId, newSettings) => {
    await updateSettings(newSettings);
    await invalidateCache(userId);
};
const updateSettings = async (newSettings) => {
    // 實現更新邏輯
};
//# sourceMappingURL=cacheUtils.js.map