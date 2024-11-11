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
    console.log('開始解析時間:', timestamp);
    
    // 如果是 ISO 格式，直接返回
    if (timestamp.includes('T') || timestamp.includes('Z')) {
      return new Date(timestamp);
    }

    // 處理中文格式 "2024-11-10 下午08:03:19"
    const [datePart, timePart] = timestamp.split(' ');
    if (!datePart || !timePart) {
      throw new Error('無效的時間格式');
    }

    const [year, month, day] = datePart.split('-').map(Number);
    const meridiem = timePart.substring(0, 2);
    const timeString = timePart.substring(2);
    const [hours, minutes, seconds] = timeString.split(':').map(Number);

    // 驗證所有數值
    if ([year, month, day, hours, minutes, seconds].some(num => isNaN(num))) {
      throw new Error('時間格式包含無效數字');
    }

    let adjustedHours = hours;
    if (meridiem === '下午' && hours < 12) {
      adjustedHours += 12;
    } else if (meridiem === '上午' && hours === 12) {
      adjustedHours = 0;
    }

    // 使用 Date.UTC 來創建時間
    const date = new Date(Date.UTC(year, month - 1, day, adjustedHours, minutes, seconds));
    
    // 調整為本地時間
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));

    if (isNaN(localDate.getTime())) {
      throw new Error('無效的日期物件');
    }

    console.log('解析結果:', {
      original: timestamp,
      parsed: localDate,
      isValid: !isNaN(localDate.getTime())
    });

    return localDate;
  } catch (error) {
    console.error('解析時間發生錯誤:', error);
    // 返回一個有效的預設日期，而不是 new Date()
    return new Date(Date.now());
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