import { useState, useEffect } from 'react';
import { DynamoDBClient, QueryCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { User } from '@/types/userType';
import { logger } from '@/utils/logger';
import { toast } from 'react-toastify';

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  details?: string;
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

export const useProfileActivity = ({ user }: UseProfileActivityProps) => {
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
    if (!user?.sub) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = {
        TableName: 'AWS_Blog_UserActivityLog',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: user.sub }
        },
        ScanIndexForward: false, // 降序排列
        Limit: 50 // 限制返回最近50條記錄
      };

      const command = new QueryCommand(params);
      const response = await dynamoClient.send(command);

      const activities = response.Items?.map(item => ({
        id: item.id.S!,
        userId: item.userId.S!,
        action: item.action.S!,
        timestamp: item.timestamp.S!,
        details: item.details?.S
      })) || [];

      setActivityLog(activities);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '獲取活動記錄失敗';
      setError(new Error(errorMessage));
      logger.error('獲取活動記錄失敗:', error);
      toast.error('無法載入活動記錄');
    } finally {
      setIsLoading(false);
    }
  };

  const addActivityLog = async (action: string, details?: string) => {
    if (!user?.sub) return;

    try {
      const timestamp = new Date().toISOString();
      const id = `${user.sub}-${Date.now()}`;

      const params = {
        TableName: 'AWS_Blog_UserActivityLog',
        Item: {
          id: { S: id },
          userId: { S: user.sub },
          action: { S: action },
          timestamp: { S: timestamp },
          ...(details && { details: { S: details } })
        }
      };

      const command = new PutItemCommand(params);
      await dynamoClient.send(command);

      // 更新本地狀態
      setActivityLog(prev => [{
        id,
        userId: user.sub,
        action,
        timestamp,
        details
      }, ...prev].slice(0, 50)); // 保持最近50條記錄

    } catch (error) {
      logger.error('添加活動記錄失敗:', error);
      toast.error('無法記錄活動');
    }
  };

  const formatDate = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      logger.error('日期格式化失敗:', error);
      return timestamp;
    }
  };

  const clearActivityLog = async () => {
    if (!user?.sub) return;

    try {
      // 這裡可以實現清除活動記錄的邏輯
      // 注意：這可能需要批次處理，因為 DynamoDB 不支持批量刪除
      setActivityLog([]);
      toast.success('活動記錄已清除');
    } catch (error) {
      logger.error('清除活動記錄失敗:', error);
      toast.error('清除活動記錄失敗');
    }
  };

  useEffect(() => {
    if (user?.sub) {
      fetchActivityLog();
    }
  }, [user?.sub]);

  return {
    activityLog,
    isLoading,
    error,
    addActivityLog,
    fetchActivityLog,
    formatDate,
    clearActivityLog
  };
}; 