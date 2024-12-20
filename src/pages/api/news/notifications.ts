import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, QueryCommand, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const dbClient = new DynamoDBClient({ region: "ap-northeast-1" });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { userId, since } = req.query;

    try {
      // 修改查詢參數，使用 Query 而不是 Scan
      const notificationsParams = {
        TableName: "AWS_Blog_UserNotifications",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": { S: userId as string }
        },
        ScanIndexForward: false, // 降序排列，最新的在前
        Limit: 50 // 限制返回數量
      };

      const notificationsResult = await dbClient.send(new QueryCommand(notificationsParams));
      
      // 收集所有文章 ID
      const articleIds = notificationsResult.Items?.map(item => item.article_id.S) || [];
      const articles = [];

      // 批次獲取文章詳情
      for (const notification of notificationsResult.Items || []) {
        const articleParams = {
          TableName: "AWS_Blog_News",
          Key: {
            "article_id": { S: notification.article_id.S || '' }
          }
        } as const;
        
        try {
          const articleResult = await dbClient.send(new GetItemCommand(articleParams));
          if (articleResult.Item) {
            articles.push({
              article_id: notification.article_id.S,
              title: articleResult.Item.title.S,
              translated_title: articleResult.Item.translated_title.S,
              published_at: parseInt(articleResult.Item.published_at.N || '0'),
              summary: articleResult.Item.summary.S,
              link: articleResult.Item.link.S,
              read: notification.read?.BOOL || false
            });
          }
        } catch (error) {
          console.error(`獲取文章失敗 (ID: ${notification.article_id.S}):`, error);
        }
      }

      res.status(200).json({ 
        articles: articles.sort((a, b) => b.published_at - a.published_at)
      });
    } catch (error) {
      console.error('獲取通知失敗:', error);
      res.status(500).json({ error: '獲取通知失敗' });
    }
  } else if (req.method === 'POST') {
    // 從 updateNews.js 移植標記已讀功能
    const { userId } = req.body;
    
    try {
      const notificationsParams = {
        TableName: "AWS_Blog_UserNotifications",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": { S: userId }
        }
      };

      const notificationsResult = await dbClient.send(new QueryCommand(notificationsParams));

      // 更新所有通知為已讀
      for (const item of notificationsResult.Items || []) {
        if (!item.article_id.S) continue; // 跳過沒有 article_id 的項目
        
        const updateParams = {
          TableName: "AWS_Blog_UserNotifications",
          Key: {
            userId: { S: userId },
            article_id: { S: item.article_id.S }
          },
          UpdateExpression: "SET #read = :true",
          ExpressionAttributeNames: {
            "#read": "read"
          },
          ExpressionAttributeValues: {
            ":true": { BOOL: true }
          }
        };

        await dbClient.send(new UpdateItemCommand(updateParams));
      }

      return res.status(200).json({ message: "所有通知已標記為已讀" });
    } catch (error) {
      console.error("標記通知已讀時發生錯誤:", error);
      return res.status(500).json({ error: "內部伺服器錯誤" });
    }
  } else {
    res.status(405).end();
  }
} 