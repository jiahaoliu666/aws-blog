import { NextApiRequest, NextApiResponse } from 'next';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb'; // 載入 DynamoDB 的命令
import client from '@/libs/dynamodb'; // 載入 DynamoDB 客戶端

const TABLE_NAME = 'AWS_Blog_UserFavorites'; // 請替換為您的 DynamoDB 表名稱

// 定義請求體的類型
interface RemoveFavoriteRequestBody {
  userId: string;
  articleId: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 檢查請求方法是否為 POST
  if (req.method === 'POST') {
    const { userId, articleId }: RemoveFavoriteRequestBody = req.body;

    // 檢查請求參數是否完整
    if (!userId || !articleId) {
      console.warn('請求參數不完整:', { userId, articleId });
      return res.status(400).json({ message: '請求參數不完整' });
    }

    const params = {
      TableName: TABLE_NAME,
      Key: {
        userId,
        article_id: articleId, // 確保這裡的鍵名稱與 DynamoDB 中的鍵一致
      },
    };

    try {
      const command = new DeleteCommand(params);
      await client.send(command);
      return res.status(200).json({ message: '成功取消收藏' });
    } catch (error) {
      console.error('從 DynamoDB 刪除失敗:', error instanceof Error ? error.message : error); // 日誌更詳細的錯誤信息
      return res.status(500).json({ message: '內部伺服器錯誤', error: error instanceof Error ? error.message : '未知錯誤' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
