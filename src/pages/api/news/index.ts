// src/pages/api/news/index.ts  
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import type { NextApiRequest, NextApiResponse } from 'next';

const dbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-1'
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: '方法不允許' });
  }

  try {
    const params = {
      TableName: "AWS_Blog_News",
    };

    const command = new ScanCommand(params);
    const response = await dbClient.send(command);

    if (!response.Items) {
      return res.status(200).json({ items: [] });
    }

    const items = response.Items.map(item => unmarshall(item));

    // 根據 created_at 降序排序
    items.sort((a, b) => Number(b.created_at) - Number(a.created_at));

    return res.status(200).json({ items });

  } catch (error) {
    console.error('獲取新聞數據時發生錯誤:', error);
    return res.status(500).json({ message: '獲取新聞數據時發生錯誤' });
  }
}

