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
  parsedDate: Date;
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
    console.log('開始解析時間:', timestamp); // 除錯日誌

    // 處理格式如 "2024-11-10 下午05:29:32"
    const [datePart, timePart] = timestamp.split(' ');
    console.log('分割後:', { datePart, timePart }); // 除錯日誌

    // 直接處理時間部分，不使用正則表達式
    const timePrefix = timePart.substring(0, 2); // "下午"
    const timeString = timePart.substring(2);    // "05:29:32"
    console.log('時間部分:', { timePrefix, timeString }); // 除錯日誌

    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const [year, month, day] = datePart.split('-').map(Number);

    let adjustedHours = hours;
    if (timePrefix === '下午' && hours < 12) {
      adjustedHours += 12;
    } else if (timePrefix === '上午' && hours === 12) {
      adjustedHours = 0;
    }

    console.log('調整後的時間:', {
      year, month, day, hours: adjustedHours, minutes, seconds
    }); // 除錯日誌

    const date = new Date(year, month - 1, day, adjustedHours, minutes, seconds);
    console.log('最終日期物件:', date); // 除錯日誌

    return date;
  } catch (error) {
    console.error('解析時間發生錯誤:', error, timestamp);
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

      const activities = response.Items.map(item => {
        const timestamp = item.timestamp.S || new Date().toISOString();
        console.log('原始時間戳:', timestamp); // 除錯日誌
        
        const parsedDate = parseChineseDateTime(timestamp);
        console.log('解析後的日期:', parsedDate); // 除錯日誌
        
        const activity = {
          id: item.id?.S || `${Date.now()}-${Math.random()}`,
          userId: item.userId.S!,
          action: item.action.S || '',
          timestamp,
          parsedDate,
          details: item.details?.S,
          type: item.type?.S || 'user_action',
          description: item.description?.S || item.action.S || '未知活動'
        };
        
        console.log('建立的活動物件:', activity); // 除錯日誌
        return activity;
      });

      // 確保時間排序正確
      activities.sort((a, b) => {
        const dateA = a.parsedDate.getTime();
        const dateB = b.parsedDate.getTime();
        return dateB - dateA;  // 降序排列
      });
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
      const now = new Date();
      const timestamp = now.toISOString();
      const id = `${user.sub}-${Date.now()}`;
      const type = 'user_action';

      // 更新本地狀態
      const newActivity = {
        id,
        userId: user.sub,
        action,
        timestamp,
        parsedDate: now,
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