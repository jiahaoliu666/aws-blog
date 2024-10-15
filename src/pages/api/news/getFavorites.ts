// src/pages/api/news/getFavorites.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

// 創建 DynamoDB 客戶端
const client = new DynamoDBClient({ region: 'ap-northeast-1' }); // 替換為您的 AWS 區域

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 檢查請求方法
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;

  // 檢查 userId 是否存在
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid userId parameter' });
  }

  // 建立查詢命令，查詢 UserFavorites 表
  const command = new QueryCommand({
    TableName: 'AWS_Blog_UserFavorites', // 替換為新的 DynomoDB 表名
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
  });

  try {
    // 執行查詢命令
    const data = await client.send(command);
    const favorites = data.Items || []; // 獲取查詢結果
    res.status(200).json(favorites); // 返回收藏文章
  } catch (error) {
    console.error('獲取收藏文章時發生錯誤:', error); // 記錄錯誤
    res.status(500).json({
      error: 'Internal Server Error',
      message: '獲取收藏文章時發生的錯誤', // 添加通用錯誤消息
    });
  }
}
