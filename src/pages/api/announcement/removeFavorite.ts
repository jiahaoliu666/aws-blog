import { NextApiRequest, NextApiResponse } from 'next';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import client from '@/libs/dynamodb';

const TABLE_NAME = 'AWS_Blog_UserAnnouncementFavorites';

interface RemoveFavoriteRequestBody {
  userId: string;
  articleId: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, articleId }: RemoveFavoriteRequestBody = req.body;

    if (!userId || !articleId) {
      console.warn('請求參數不完整:', { userId, articleId });
      return res.status(400).json({ message: '請求參數不完整' });
    }

    const params = {
      TableName: TABLE_NAME,
      Key: {
        userId,
        article_id: articleId,
      },
    };

    try {
      const command = new DeleteCommand(params);
      await client.send(command);
      return res.status(200).json({ message: '成功取消收藏' });
    } catch (error) {
      console.error('從 DynamoDB 刪除失敗:', error instanceof Error ? error.message : error);
      return res.status(500).json({ message: '內部伺服器錯誤', error: error instanceof Error ? error.message : '未知錯誤' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 