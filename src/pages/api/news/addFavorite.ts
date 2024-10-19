// src/pages/api/news/addFavorite.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import client from '@/libs/dynamodb';

const USER_FAVORITES_TABLE = 'AWS_Blog_UserFavorites'; // 用戶收藏資料表名稱
const NEWS_TABLE = 'AWS_Blog_News'; // 新聞文章資料表名稱

interface FavoriteRequestBody {
    userId: string;
    articleId: string; // 確保這個ID是對應你資料表的主鍵
    title: string; // 新增 title 以進行查詢
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { userId, articleId, title }: FavoriteRequestBody = req.body; // 获取 title

        // 檢查請求參數的完整性
        if (!userId || !articleId || !title) { // 也检查 title 的完整性
            console.warn('請求參數不完整:', { userId, articleId, title });
            return res.status(400).json({ message: '請求參數不完整' });
        }

        console.log('請求參數:', { userId, articleId, title });

        // 查詢 AWS_Blog_News 表，檢查文章是否存在
        const getNewsParams = {
            TableName: NEWS_TABLE,
            Key: {
                article_id: articleId, // 使用正確的鍵名
            },
        };

        console.log('正在查詢 AWS_Blog_News:', JSON.stringify(getNewsParams));

        try {
            const articleResponse = await client.send(new GetCommand(getNewsParams));
            const articleData = articleResponse.Item;

            // 檢查查詢結果
            if (!articleData) {
                console.warn('未找到文章:', { articleId, title });
                return res.status(404).json({ message: '未找到文章' });
            }

            // 準備將用戶收藏資訊寫入 AWS_Blog_UserFavorites 表
            const params = {
                TableName: USER_FAVORITES_TABLE,
                Item: {
                    userId,          // 儲存 userId
                    article_id: articleId, // 使用正確的鍵名
                    createdAt: new Date().toISOString(), // 可選的時間戳
                },
            };

            console.log('準備儲存的用戶收藏資料:', JSON.stringify(params));

            // 將收藏信息寫入 AWS_Blog_UserFavorites 表
            await client.send(new PutCommand(params));
            console.log('收藏成功:', params.Item);

            return res.status(200).json({ message: '收藏成功', item: { userId, article_id: articleId } });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('發生錯誤:', error);
                return res.status(500).json({ message: '內部伺服器錯誤', error: error.message });
            }
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}


