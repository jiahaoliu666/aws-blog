import { useState, useEffect } from 'react';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { User } from '@/types/userType';
import { logger } from '@/utils/logger';

interface ActivityLog {
  date: string;
  action: string;
}

interface UseProfileActivityProps {
  user: User | null;
}

export type UseProfileActivityReturn = {
  activityLog: ActivityLog[];
  isLoading: boolean;
  addActivityLog: (action: string) => Promise<void>;
  formatDate: (dateString: string) => string;
  fetchActivityLog: () => Promise<void>;
};

export const useProfileActivity = ({ user }: UseProfileActivityProps): UseProfileActivityReturn => {
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const dynamoClient = new DynamoDBClient({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const fetchActivityLog = async () => {
    if (!user?.sub) return;

    setIsLoading(true);
    try {
      const params = {
        TableName: 'AWS_Blog_UserActivityLog',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: user.sub },
        },
        ScanIndexForward: false, // 降序排列
        Limit: 12, // 限制返回數量
      };

      const command = new QueryCommand(params);
      const response = await dynamoClient.send(command);
      
      const logs = response.Items?.map(item => ({
        date: item.timestamp?.S || '',
        action: item.action?.S || '',
      })) || [];

      setActivityLog(logs);
      
    } catch (error) {
      logger.error('獲取活動記錄失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 新增活動記錄
  const addActivityLog = async (action: string) => {
    if (!user?.sub) return;

    try {
      const timestamp = new Date().toISOString();
      const params = {
        TableName: 'AWS_Blog_UserActivityLog',
        Item: {
          userId: { S: user.sub },
          timestamp: { S: timestamp },
          action: { S: action },
        },
      };

      await dynamoClient.send(new QueryCommand(params));
      
      // 更新本地狀態
      setActivityLog(prev => [{
        date: timestamp,
        action
      }, ...prev].slice(0, 12));

    } catch (error) {
      logger.error('新增活動記錄失敗:', error);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      return dateString;
    }
  };

  useEffect(() => {
    fetchActivityLog();
  }, [user?.sub]);

  return {
    activityLog,
    isLoading,
    addActivityLog,
    formatDate,
    fetchActivityLog
  };
}; 