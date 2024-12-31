import { useState, useEffect, useCallback } from 'react';
import { DynamoDBClient, QueryCommand, PutItemCommand, DeleteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { User } from '@/types/userType';
import { logger } from '@/utils/logger';
import { toast } from 'react-toastify';
import { formatTimeAgo } from '@/utils/dateUtils';

interface Article {
  id: string;
  userId: string;
  title: string;
  translatedTitle: string;
  link: string;
  timestamp: string;
  timeAgo: string;
  sourcePage: string;
  category?: string;
  announcementType?: string;
  readStatus?: 'unread' | 'reading' | 'completed';
  solutionType?: string;
  architectureType?: string;
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

  const fetchFavorites = async () => {
    try {
      const params = {
        TableName: 'AWS_Blog_UserFavorites',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: user?.sub || '' }
        }
      };

      const command = new QueryCommand(params);
      const response = await dynamoClient.send(command);
      
      return response.Items?.map(item => ({
        article_id: item.article_id?.S,
        title: item.title?.S,
        description: item.description?.S
      })) || [];
    } catch (error) {
      console.error('獲取收藏文章失敗:', error);
      return [];
    }
  };

  const fetchRecentArticles = async () => {
    if (!user?.sub) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = {
        TableName: 'AWS_Blog_UserRecentArticles',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: user.sub }
        },
        ScanIndexForward: false,
        Limit: 12
      };

      const command = new QueryCommand(params);
      const response = await dynamoClient.send(command);
      
      const articleData = response.Items?.map(item => ({
        articleId: item.articleId?.S,
        timestamp: item.timestamp?.S,
        sourcePage: item.sourcePage?.S || '未知來源'
      }))
      // 過濾掉 sourcePage = "收藏文章" 的記錄
      .filter(data => {
        const validSourcePages = ['最新公告', '最新新聞', '解決方案', '架構參考', '知識中心'];
        return data.articleId && 
               data.timestamp && 
               validSourcePages.includes(data.sourcePage);
      }) || [];

      const articles = await Promise.all(articleData.map(async ({ articleId, timestamp, sourcePage }) => {
        const validSourcePage = ['最新公告', '最新新聞', '解決方案', '架構參考', '知識中心'].includes(sourcePage) 
            ? sourcePage 
            : '最新新聞'; // 預設值
        
        const tableName = 
          validSourcePage === '最新公告' ? 'AWS_Blog_Announcement' :
          validSourcePage === '解決方案' ? 'AWS_Blog_Solutions' :
          validSourcePage === '架構參考' ? 'AWS_Blog_Architecture' :
          validSourcePage === '知識中心' ? 'AWS_Blog_Knowledge' :
          'AWS_Blog_News';
        
        const detailParams = {
          TableName: tableName,
          KeyConditionExpression: 'article_id = :articleId',
          ExpressionAttributeValues: {
            ':articleId': { S: articleId! }
          }
        };

        const detailCommand = new QueryCommand(detailParams);
        const detailResponse = await dynamoClient.send(detailCommand);
        
        const item = detailResponse.Items?.[0];
        
        return {
          id: articleId!,
          userId: user.sub,
          title: item?.title?.S || '標題不可用',
          translatedTitle: item?.translated_title?.S || '標題不可用',
          link: item?.link?.S || '#',
          timestamp: timestamp!,
          timeAgo: formatTimeAgo(new Date(timestamp!)),
          sourcePage,
          category: tableName === 'AWS_Blog_News' ? item?.category?.S : undefined,
          announcementType: tableName === 'AWS_Blog_Announcement' ? item?.type?.S : undefined,
          solutionType: tableName === 'AWS_Blog_Solutions' ? item?.type?.S : undefined,
          architectureType: tableName === 'AWS_Blog_Architecture' ? item?.type?.S : undefined
        };
      }));

      setRecentArticles(articles.slice(0, 12));
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

      // 儲存新紀錄
      const putParams = {
        TableName: 'AWS_Blog_UserRecentArticles',
        Item: {
          userId: { S: user.sub },
          articleId: { S: articleId },
          timestamp: { S: timestamp },
          link: { S: link },
          sourcePage: { S: sourcePage }
        }
      };

      const putCommand = new PutItemCommand(putParams);
      await dynamoClient.send(putCommand);

      // 檢查並刪除舊紀錄
      const queryParams = {
        TableName: 'AWS_Blog_UserRecentArticles',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: user.sub }
        },
        ScanIndexForward: true // 升序排序以獲取最舊的記錄
      };

      const queryCommand = new QueryCommand(queryParams);
      const response = await dynamoClient.send(queryCommand);

      if (response.Items && response.Items.length > 12) {
        // 刪除最舊的記錄
        const oldestArticle = response.Items[0];
        if (oldestArticle.timestamp?.S) {
          const deleteParams = {
            TableName: 'AWS_Blog_UserRecentArticles',
            Key: {
              userId: { S: user.sub },
              timestamp: { S: oldestArticle.timestamp.S }
            }
          };
          const deleteCommand = new DeleteItemCommand(deleteParams);
          await dynamoClient.send(deleteCommand);
        }
      }

      // 更新本地狀態
      await fetchRecentArticles(); // 重新獲取最新記錄

    } catch (error) {
      logger.error('記錄最近文章失敗:', error);
      toast.error('無法記錄文章歷史');
    }
  };

  const updateArticleReadStatus = async (articleId: string, status: 'unread' | 'reading' | 'completed') => {
    if (!user?.sub) return;

    try {
      const params = {
        TableName: 'AWS_Blog_UserRecentArticles',
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
        TableName: 'AWS_Blog_UserRecentArticles',
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

  const getFavoriteArticles = useCallback(async () => {
    try {
      const favorites = await fetchFavorites();
      
      // 過濾掉無效的收藏文章
      const validFavorites = favorites.filter(favorite => 
        favorite && 
        favorite.article_id && 
        favorite.title && 
        favorite.description
      );

      return validFavorites;
    } catch (error) {
      console.error('獲取收藏文章失敗:', error);
      return [];
    }
  }, []);

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