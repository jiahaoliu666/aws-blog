import { DynamoDBClient, UpdateItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
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
  console.log('收到標記已讀請求:', {
    method: req.method,
    body: req.body,
    headers: req.headers
  });

  if (req.method !== 'POST') {
    console.log('請求方法不允許:', req.method);
    return res.status(405).json({ message: '方法不允許' });
  }

  const { userId, articleId } = req.body;
  console.log('請求參數:', { userId, articleId });

  if (!userId) {
    console.log('缺少用戶ID');
    return res.status(400).json({ message: '缺少必要參數' });
  }

  try {
    if (articleId) {
      console.log('開始標記單個通知已讀');
      const params = {
        TableName: 'AWS_Blog_UserNotifications',
        Key: {
          'userId': { S: userId },
          'article_id': { S: articleId }
        },
        UpdateExpression: 'SET #read = :read',
        ExpressionAttributeNames: {
          '#read': 'read'
        },
        ExpressionAttributeValues: {
          ':read': { BOOL: true }
        }
      };
      console.log('更新參數:', JSON.stringify(params, null, 2));
      await dynamoClient.send(new UpdateItemCommand(params));
      console.log('單個通知標記完成');
    } else {
      console.log('開始標記所有通知已讀');
      const queryParams = {
        TableName: 'AWS_Blog_UserNotifications',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: userId }
        }
      };
      console.log('查詢參數:', JSON.stringify(queryParams, null, 2));

      const { Items } = await dynamoClient.send(new QueryCommand(queryParams));
      console.log('找到待更新通知數量:', Items?.length);
      
      if (Items) {
        for (const item of Items) {
          console.log('正在更新通知:', item.article_id.S);
          const updateParams = {
            TableName: 'AWS_Blog_UserNotifications',
            Key: {
              'userId': { S: userId },
              'article_id': { S: item.article_id.S! }
            },
            UpdateExpression: 'SET #read = :read',
            ExpressionAttributeNames: {
              '#read': 'read'
            },
            ExpressionAttributeValues: {
              ':read': { BOOL: true }
            }
          };
          await dynamoClient.send(new UpdateItemCommand(updateParams));
        }
        console.log('所有通知已標記為已讀');
      }
    }

    return res.status(200).json({ message: '標記已讀成功' });
  } catch (error) {
    console.error('標記已讀失敗:', error);
    console.error('錯誤詳情:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });
    return res.status(500).json({ message: '標記已讀失敗' });
  }
} 