import { createClient } from 'redis';

// 確保只在伺服器端創建 Redis 客戶端
const getRedisClient = () => {
  if (typeof window === 'undefined') {
    return createClient({
      url: process.env.REDIS_URL
    });
  }
  return null;
};

export const redis = getRedisClient(); 