import { useState, useEffect } from 'react';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { User } from '@/types/userType';
import { logger } from '@/utils/logger';
import { toast } from 'react-toastify';

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  details?: string;
  type: string;
  description: string;
}

interface UseProfileActivityProps {
  user: User | null;
}

export type UseProfileActivityReturn = {
  activityLog: ActivityLog[];
  isLoading: boolean;
  error: Error | null;
  addActivityLog: (action: string, details?: string) => Promise<void>;
  fetchActivityLog: () => Promise<void>;
  formatDate: (timestamp: string) => string;
  clearActivityLog: () => Promise<void>;
};

const parseChineseDateTime = (timestamp: string): Date => {
  try {
    // 處理格式如 "2024-11-10 下午09:48:15"
    const [date, timeWithPeriod] = timestamp.split(' ');
    const isPM = timeWithPeriod.includes('下午');
    const cleanTime = timeWithPeriod.replace(/(下午|上午)/, '');
    const [hours, minutes, seconds] = cleanTime.split(':');
    
    let hour = parseInt(hours);
    if (isPM && hour !== 12) {
      hour += 12;
    } else if (!isPM && hour === 12) {
      hour = 0;
    }

    const [year, month, day] = date.split('-').map(num => parseInt(num));
    return new Date(year, month - 1, day, hour, parseInt(minutes), parseInt(seconds));
  } catch (error) {
    console.error('解析時間錯誤:', error);
    return new Date();
  }
};

export const useProfileActivity = ({ user }: UseProfileActivityProps): UseProfileActivityReturn => {
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const dynamoClient = new DynamoDBClient({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const fetchActivityLog = async () => {
    if (!user?.sub) {
      logger.warn('No user ID available for fetching activity log');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = {
        TableName: 'AWS_Blog_UserActivityLog',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: user.sub }
        },
        ScanIndexForward: false,
        Limit: 50
      };

      const command = new QueryCommand(params);
      const response = await dynamoClient.send(command);

      if (!response.Items) {
        setActivityLog([]);
        return;
      }

      const activities = response.Items.map(item => ({
        id: item.id?.S || `${Date.now()}-${Math.random()}`,
        userId: item.userId.S!,
        action: item.action.S || '',
        timestamp: item.timestamp.S || '',
        parsedDate: parseChineseDateTime(item.timestamp.S || ''),
        details: item.details?.S,
        type: item.type?.S || 'user_action',
        description: item.description?.S || item.action.S || '未知活動'
      }));

      setActivityLog(activities);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '獲取活動記錄失敗';
      logger.error('Error fetching activity log:', error);
      setError(new Error(errorMessage));
      toast.error('無法載入活動記錄');
    } finally {
      setIsLoading(false);
    }
  };

  // 在用戶變更時重新獲取活動日誌
  useEffect(() => {
    if (user?.sub) {
      fetchActivityLog();
    }
  }, [user?.sub]);

  // 每5分鐘自動更新一次
  useEffect(() => {
    if (!user?.sub) return;

    const intervalId = setInterval(() => {
      fetchActivityLog();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [user?.sub]);

  const addActivityLog = async (action: string, details?: string) => {
    if (!user?.sub) return;

    try {
      const timestamp = new Date().toISOString();
      const id = `${user.sub}-${Date.now()}`;
      const type = 'user_action';

      // 更新本地狀態
      const newActivity = {
        id,
        userId: user.sub,
        action,
        timestamp: new Date().toLocaleString('zh-TW'),
        details,
        type,
        description: details || action
      };

      setActivityLog(prev => [newActivity, ...prev].slice(0, 50));

      // 寫入資料庫
      const params = {
        TableName: 'AWS_Blog_UserActivityLog',
        Item: {
          id: { S: id },
          userId: { S: user.sub },
          action: { S: action },
          timestamp: { S: timestamp },
          type: { S: type },
          description: { S: details || action },
          ...(details && { details: { S: details } })
        }
      };

      await dynamoClient.send(new QueryCommand(params));
      logger.info('Activity log added successfully');

    } catch (error) {
      logger.error('Error adding activity log:', error);
      toast.error('無法記錄活動');
    }
  };

  return {
    activityLog,
    isLoading,
    error,
    addActivityLog,
    fetchActivityLog,
    formatDate: (timestamp: string) => new Date(timestamp).toLocaleString('zh-TW'),
    clearActivityLog: async () => {
      setActivityLog([]);
      toast.success('活動記錄已清除');
    }
  };
}; 