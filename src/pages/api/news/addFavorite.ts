// src/pages/api/news/addFavorite.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PutCommand } from '@aws-sdk/lib-dynamodb'; // 載入 DynamoDB 的命令
import client from '@/libs/dynamodb'; // 載入 DynamoDB 客戶端

const TABLE_NAME = 'AWS_Blog_UserFavorites'; // 請替換為您的 DynamoDB 表名稱

// 定義請求體的類型
interface FavoriteRequestBody {
  userId: string;
  articleId: string;
  title: string;
  link: string;
  description: string; // 新增 description 字段
  info: string; // 新增 info 字段
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 檢查請求方法是否為 POST
  if (req.method === 'POST') {
    const { userId, articleId, title, link, description, info }: FavoriteRequestBody = req.body;

    // 檢查請求參數是否完整
    if (!userId || !articleId || !title || !link || !description || !info) {
      console.warn('請求參數不完整:', { userId, articleId, title, link, description, info });
      return res.status(400).json({ message: '請求參數不完整' });
    }

    const params = {
      TableName: TABLE_NAME,
      Item: {
        userId,
        article_id: articleId,
        title,
        link,
        description, // 儲存 description
        info, // 儲存 info
        createdAt: new Date().toISOString(),
      },
    };

    try {
      const command = new PutCommand(params);
      await client.send(command);
      return res.status(200).json({ message: '收藏成功', item: params.Item });
    } catch (error) {
      // 類型斷言，將 error 作為 Error 類型
      console.error('寫入 DynamoDB 失敗:', error instanceof Error ? error.message : error); // 日誌更詳細的錯誤信息
      return res.status(500).json({ message: '內部伺服器錯誤', error: error instanceof Error ? error.message : '未知錯誤' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
