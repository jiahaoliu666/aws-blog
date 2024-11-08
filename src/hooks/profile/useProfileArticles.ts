import { useState, useEffect } from 'react';
import { DynamoDBClient, QueryCommand, PutItemCommand, DeleteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { User } from '@/types/userType';
import { logger } from '@/utils/logger';
import { toast } from 'react-toastify';

interface Article {
  id: string;
  userId: string;
  title: string;
  translatedTitle: string;
  link: string;
  timestamp: string;
  sourcePage: string;
  category?: string;
  readStatus?: 'unread' | 'reading' | 'completed';
}

interface UseProfileArticlesProps {
  user: User | null;
}

export const useProfileArticles = ({ user }: UseProfileArticlesProps) => {
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const dynamoClient = new DynamoDBClient({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const fetchRecentArticles = async () => {
    if (!user?.sub) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = {
        TableName: 'AWS_Blog_UserArticleHistory',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: user.sub }
        },
        ScanIndexForward: false,
        Limit: 20
      };

      const command = new QueryCommand(params);
      const response = await dynamoClient.send(command);

      const articles = response.Items?.map(item => ({
        id: item.id.S!,
        userId: item.userId.S!,
        title: item.title.S!,
        translatedTitle: item.translatedTitle.S!,
        link: item.link.S!,
        timestamp: item.timestamp.S!,
        sourcePage: item.sourcePage.S!,
        category: item.category?.S,
        readStatus: item.readStatus?.S as 'unread' | 'reading' | 'completed'
      })) || [];

      setRecentArticles(articles);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '獲取文章歷史記錄失敗';
      setError(new Error(errorMessage));
      logger.error('獲取文章歷史記錄失敗:', error);
      toast.error('無法載入文章歷史記錄');
    } finally {
      setIsLoading(false);
    }
  };

  const logRecentArticle = async (
    articleId: string,
    title: string,
    link: string,
    sourcePage: string,
    category?: string
  ) => {
    if (!user?.sub) return;

    try {
      const timestamp = new Date().toISOString();
      const id = `${user.sub}-${articleId}`;

      const params = {
        TableName: 'AWS_Blog_UserArticleHistory',
        Item: {
          id: { S: id },
          userId: { S: user.sub },
          title: { S: title },
          translatedTitle: { S: title }, // 可以在這裡添加翻譯邏輯
          link: { S: link },
          timestamp: { S: timestamp },
          sourcePage: { S: sourcePage },
          readStatus: { S: 'unread' },
          ...(category && { category: { S: category } })
        }
      };

      const command = new PutItemCommand(params);
      await dynamoClient.send(command);

      // 更新本地狀態
      setRecentArticles(prev => [{
        id,
        userId: user.sub,
        title,
        translatedTitle: title,
        link,
        timestamp,
        sourcePage,
        category,
        readStatus: 'unread' as const
      }, ...prev].slice(0, 20));

    } catch (error) {
      logger.error('記錄最近文章失敗:', error);
      toast.error('無法記錄文章歷史');
    }
  };

  const updateArticleReadStatus = async (articleId: string, status: 'unread' | 'reading' | 'completed') => {
    if (!user?.sub) return;

    try {
      const params = {
        TableName: 'AWS_Blog_UserArticleHistory',
        Key: {
          id: { S: articleId },
          userId: { S: user.sub }
        },
        UpdateExpression: 'SET readStatus = :status',
        ExpressionAttributeValues: {
          ':status': { S: status }
        }
      };

      const command = new UpdateItemCommand(params);
      await dynamoClient.send(command);

      // 更新本地狀態
      setRecentArticles(prev =>
        prev.map(article =>
          article.id === articleId
            ? { ...article, readStatus: status }
            : article
        )
      );

    } catch (error) {
      logger.error('更新文章閱讀狀態失敗:', error);
      toast.error('無法更新閱讀狀態');
    }
  };

  const removeArticle = async (articleId: string) => {
    if (!user?.sub) return;

    try {
      const params = {
        TableName: 'AWS_Blog_UserArticleHistory',
        Key: {
          id: { S: articleId },
          userId: { S: user.sub }
        }
      };

      const command = new DeleteItemCommand(params);
      await dynamoClient.send(command);

      // 更新本地狀態
      setRecentArticles(prev =>
        prev.filter(article => article.id !== articleId)
      );

      toast.success('文章已從歷史記錄中移除');
    } catch (error) {
      logger.error('移除文章失敗:', error);
      toast.error('無法移除文章');
    }
  };

  useEffect(() => {
    if (user?.sub) {
      fetchRecentArticles();
    }
  }, [user?.sub]);

  return {
    recentArticles,
    isLoading,
    error,
    logRecentArticle,
    fetchRecentArticles,
    updateArticleReadStatus,
    removeArticle
  };
};

export type UseProfileArticlesReturn = {
  recentArticles: Article[];
  isLoading: boolean;
  error: Error | null;
  logRecentArticle: (
    articleId: string,
    title: string,
    link: string,
    sourcePage: string,
    category?: string
  ) => Promise<void>;
  fetchRecentArticles: () => Promise<void>;
  updateArticleReadStatus: (articleId: string, status: 'unread' | 'reading' | 'completed') => Promise<void>;
  removeArticle: (articleId: string) => Promise<void>;
}; 