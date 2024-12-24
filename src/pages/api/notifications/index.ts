import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import type { NextApiRequest, NextApiResponse } from 'next';

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
  console.log('收到通知請求:', {
    method: req.method,
    query: req.query
  });

  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允許' });
  }

  const { userId } = req.query;
  console.log('用戶ID:', userId);

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ message: '無效的用戶ID' });
  }

  try {
    // 查詢用戶的通知記錄
    const userNotificationsParams = {
      TableName: 'AWS_Blog_UserNotifications',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': { S: userId }
      },
      ScanIndexForward: false // 降序排序，最新的在前
    };

    console.log('查詢用戶通知參數:', JSON.stringify(userNotificationsParams, null, 2));
    const userNotifications = await dynamoClient.send(new QueryCommand(userNotificationsParams));
    console.log('用戶通知數量:', userNotifications.Items?.length || 0);

    if (!userNotifications.Items?.length) {
      return res.status(200).json({ notifications: [] });
    }

    // 處理每個通知，獲取對應的文章或公告詳情
    const notifications = await Promise.all(userNotifications.Items.map(async (notification) => {
      const articleId = notification.article_id.S!;
      const category = notification.category.S || 'news';
      const tableName = category === 'news' ? 'AWS_Blog_News' : 'AWS_Blog_Announcement';

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

        return {
          article_id: articleId,
          title: article.translated_title?.S || article.title.S,
          date: new Date(Number(notification.created_at?.N || Date.now())).toISOString(),
          content: article.summary?.S || '',
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