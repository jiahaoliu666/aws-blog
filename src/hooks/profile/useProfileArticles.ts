import { useState, useEffect } from 'react';
import { DynamoDBClient, QueryCommand, PutItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { User } from '@/types/userType';
import { logger } from '@/utils/logger';

interface Article {
  translatedTitle: string;
  link: string;
  timestamp: string;
  sourcePage: string;
}

interface UseProfileArticlesProps {
  user: User | null;
}

export type UseProfileArticlesReturn = {
  recentArticles: Article[];
  isLoading: boolean;
  logRecentArticle: (articleId: string, link: string, sourcePage: string) => Promise<void>;
  fetchRecentArticles: () => Promise<void>;
};

export const useProfileArticles = ({ user }: UseProfileArticlesProps): UseProfileArticlesReturn => {
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const dynamoClient = new DynamoDBClient({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const fetchRecentArticles = async () => {
    if (!user?.sub) return;

    setIsLoading(true);
    try {
      const params = {
        TableName: 'AWS_Blog_UserRecentArticles',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: user.sub },
        },
        ScanIndexForward: false,
        Limit: 12,
      };

      const command = new QueryCommand(params);
      const response = await dynamoClient.send(command);
      
      const articleData = response.Items?.map(item => {
        const articleId = item.articleId?.S;
        const timestamp = item.timestamp?.S;
        const sourcePage = item.sourcePage?.S || '未知來源';

        if (articleId && timestamp) {
          return { articleId, timestamp, sourcePage };
        }
        return null;
      }).filter((data): data is { articleId: string; timestamp: string; sourcePage: string } => data !== null) || [];

      const articles = await Promise.all(articleData.map(async ({ articleId, timestamp, sourcePage }) => {
        const newsParams = {
          TableName: 'AWS_Blog_News',
          KeyConditionExpression: 'article_id = :articleId',
          ExpressionAttributeValues: {
            ':articleId': { S: articleId },
          },
        };
        
        const newsCommand = new QueryCommand(newsParams);
        const newsResponse = await dynamoClient.send(newsCommand);
        const translatedTitle = newsResponse.Items?.[0]?.translated_title?.S || '標題不可用';
        const link = newsResponse.Items?.[0]?.link?.S || '#';
        
        return { translatedTitle, link, timestamp, sourcePage };
      }));

      setRecentArticles(articles.slice(0, 12));
      
    } catch (error) {
      logger.error('獲取最近文章失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logRecentArticle = async (articleId: string, link: string, sourcePage: string) => {
    if (!user?.sub) return;

    try {
      const timestamp = new Date().toISOString();

      // 新增文章記錄
      const putParams = {
        TableName: 'AWS_Blog_UserRecentArticles',
        Item: {
          userId: { S: user.sub },
          articleId: { S: articleId },
          timestamp: { S: timestamp },
          link: { S: link },
          sourcePage: { S: sourcePage },
        },
      };
      
      const putCommand = new PutItemCommand(putParams);
      await dynamoClient.send(putCommand);

      // 檢查並維持最大記錄數
      const queryParams = {
        TableName: 'AWS_Blog_UserRecentArticles',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: user.sub },
        },
        ScanIndexForward: true,
      };
      
      const queryCommand = new QueryCommand(queryParams);
      const response = await dynamoClient.send(queryCommand);

      if (response.Items && response.Items.length > 12) {
        // 刪除最舊的記錄
        const oldestArticle = response.Items[0];
        if (oldestArticle.timestamp.S) {
          const deleteParams = {
            TableName: 'AWS_Blog_UserRecentArticles',
            Key: {
              userId: { S: user.sub },
              timestamp: { S: oldestArticle.timestamp.S },
            },
          };
          
          const deleteCommand = new DeleteItemCommand(deleteParams);
          await dynamoClient.send(deleteCommand);
        }
      }

      // 更新本地狀態
      await fetchRecentArticles();
      
    } catch (error) {
      logger.error('記錄最近文章失敗:', error);
    }
  };

  useEffect(() => {
    fetchRecentArticles();
  }, [user?.sub]);

  return {
    recentArticles,
    isLoading,
    logRecentArticle,
    fetchRecentArticles
  };
}; 