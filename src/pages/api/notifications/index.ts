import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import type { NextApiRequest, NextApiResponse } from 'next';

type QueryParams = {
  TableName: string;
  KeyConditionExpression: string;
  FilterExpression?: string;
  ExpressionAttributeValues: {
    [key: string]: { S: string };
  };
};

const dynamoClient = new DynamoDBClient({
  region: 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const { userId, category, limit = '6' } = req.query;
  const isGuest = userId === 'guest';
  
  // 訪客模式只返回公開文章
  if (isGuest) {
    try {
      // 定義所有要查詢的表格
      const tables = [
        { name: 'AWS_Blog_News', category: 'news' },
        { name: 'AWS_Blog_Announcement', category: 'announcement' },
        { name: 'AWS_Blog_Solutions', category: 'solution' },
        { name: 'AWS_Blog_Architecture', category: 'architecture' },
        { name: 'AWS_Blog_Knowledge', category: 'knowledge' }
      ];

      // 並行查詢所有表格
      const allArticles = await Promise.all(
        tables.map(async ({ name, category }) => {
          const params = {
            TableName: name,
            Limit: parseInt(limit as string),
          };

          try {
            const result = await dynamoClient.send(new ScanCommand(params));
            return (result.Items || []).map(article => ({
              article_id: article.article_id.S,
              title: article.translated_title?.S || article.title.S,
              date: article.published_at?.N ? parseInt(article.published_at.N) * 1000 : Date.now(),
              category,
              link: article.link?.S || '',
            }));
          } catch (error) {
            console.error(`Error scanning ${name}:`, error);
            return [];
          }
        })
      );

      // 合併所有結果並排序
      const formattedArticles = allArticles
        .flat()
        .sort((a, b) => b.date - a.date)
        .slice(0, parseInt(limit as string));

      return res.status(200).json({
        notifications: formattedArticles,
        total: formattedArticles.length
      });
    } catch (error) {
      console.error('獲取公開文章失敗:', error);
      return res.status(500).json({ 
        message: '獲取文章失敗',
        error: (error as Error).message 
      });
    }
  }

  // 原有的用戶通知邏輯保持不變
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ message: '無效的用戶ID' });
  }

  try {
    // 查詢用戶的通知記錄
    const userNotificationsParams: QueryParams = {
      TableName: 'AWS_Blog_UserNotifications',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': { S: userId }
      }
    };

    // 如果有指定分類，添加過濾條件
    if (category && typeof category === 'string') {
      userNotificationsParams.FilterExpression = 'category = :category';
      userNotificationsParams.ExpressionAttributeValues[':category'] = { S: category };
    }

    console.log('查詢用戶通知參數:', JSON.stringify(userNotificationsParams, null, 2));
    const userNotifications = await dynamoClient.send(new QueryCommand(userNotificationsParams));
    console.log('用戶通知數量:', userNotifications.Items?.length || 0);

    if (!userNotifications.Items?.length) {
      return res.status(200).json({ notifications: [] });
    }

    // 處理每個通知，獲取對應的文章或公告詳情
    const notifications = await Promise.all(userNotifications.Items.map(async (notification) => {
      const articleId = notification.article_id.S!;
      const category = notification.category.S?.toLowerCase() || 'news';
      
      // 根據不同類別選擇對應的表格
      let tableName;
      switch(category) {
        case 'news':
          tableName = 'AWS_Blog_News';
          break;
        case 'announcement':
          tableName = 'AWS_Blog_Announcement';
          break;
        case 'solution':
          tableName = 'AWS_Blog_Solutions';
          break;
        case 'architecture':
          tableName = 'AWS_Blog_Architecture';
          break;
        case 'knowledge':
          tableName = 'AWS_Blog_Knowledge';
          break;
        default:
          tableName = 'AWS_Blog_News';
      }

      // 查詢文章詳情
      const articleParams = {
        TableName: tableName,
        KeyConditionExpression: 'article_id = :articleId',
        ExpressionAttributeValues: {
          ':articleId': { S: articleId }
        }
      };

      try {
        const articleResponse = await dynamoClient.send(new QueryCommand(articleParams));
        const article = articleResponse.Items?.[0];

        if (!article) {
          console.log(`未找到文章: ${articleId}`);
          return null;
        }

        // 確保使用 created_at 的時間戳
        const createdAtTimestamp = notification.created_at?.N 
          ? parseInt(notification.created_at.N) * 1000
          : Date.now();

        // 根據不同類別處理內容
        let content = '';
        if (category === 'solution') {
          content = article.summary?.S || article.description?.S || '';
        } else {
          content = article.summary?.S || '';
        }

        return {
          article_id: articleId,
          title: article.translated_title?.S || article.title.S,
          date: createdAtTimestamp,
          content: content,
          read: notification.read?.BOOL || false,
          category: category,
          link: article.link?.S || ''
        };
      } catch (err) {
        console.error(`獲取文章 ${articleId} 詳情失敗:`, err);
        return null;
      }
    }));

    // 過濾掉無效的通知並返回
    const validNotifications = notifications.filter(Boolean);
    console.log('有效通知數量:', validNotifications.length);

    return res.status(200).json({ 
      notifications: validNotifications,
      total: validNotifications.length
    });

  } catch (error) {
    console.error('獲取通知失敗:', error);
    console.error('錯誤詳情:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    
    return res.status(500).json({ 
      message: '獲取通知失敗',
      error: (error as Error).message 
    });
  }
} 