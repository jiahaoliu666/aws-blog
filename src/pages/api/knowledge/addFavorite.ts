import { NextApiRequest, NextApiResponse } from 'next';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import client from '@/libs/dynamodb';

const USER_FAVORITES_TABLE = 'AWS_Blog_UserFavorites';
const KNOWLEDGE_TABLE = 'AWS_Blog_Knowledge';

interface FavoriteRequestBody {
    userId: string;
    articleId: string;
    title: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { userId, articleId, title }: FavoriteRequestBody = req.body;

        if (!userId || !articleId || !title) {
            console.warn('請求參數不完整:', { userId, articleId, title });
            return res.status(400).json({ message: '請求參數不完整' });
        }

        console.log('收到收藏請求:', { userId, articleId, title });

        const getKnowledgeParams = {
            TableName: KNOWLEDGE_TABLE,
            Key: {
                article_id: articleId,
            },
        };

        try {
            console.log('查詢知識庫文章:', getKnowledgeParams);
            const knowledgeResponse = await client.send(new GetCommand(getKnowledgeParams));
            
            console.log('查詢結果:', knowledgeResponse.Item);

            const knowledgeData = knowledgeResponse.Item;

            if (!knowledgeData) {
                console.warn('未找到知識庫文章:', { articleId, title });
                return res.status(404).json({ message: '未找到知識庫文章' });
            }

            const params = {
                TableName: USER_FAVORITES_TABLE,
                Item: {
                    userId: userId,
                    article_id: articleId,
                    category: 'Knowledge',
                    createdAt: new Date().toISOString()
                },
            };

            console.log('準備添加收藏:', params);
            await client.send(new PutCommand(params));
            console.log('收藏成功');

            return res.status(200).json({ 
                message: '收藏成功', 
                item: {
                    ...params.Item,
                    title: title
                }
            });
        } catch (error) {
            console.error('收藏失敗:', {
                error,
                params: getKnowledgeParams,
                userId,
                articleId
            });
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