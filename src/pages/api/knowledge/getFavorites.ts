import { NextApiRequest, NextApiResponse } from 'next';
import { QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import client from '@/libs/dynamodb';

const USER_FAVORITES_TABLE = 'AWS_Blog_UserFavorites';
const KNOWLEDGE_TABLE = 'AWS_Blog_Knowledge';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const { userId } = req.query;

        if (!userId || typeof userId !== 'string') {
            console.warn('請求參數不完整:', { userId });
            return res.status(400).json({ message: '請求參數不完整' });
        }

        console.log('請求參數:', { userId });

        const getFavoritesParams = {
            TableName: USER_FAVORITES_TABLE,
            KeyConditionExpression: 'userId = :userId',
            FilterExpression: 'category = :category',
            ExpressionAttributeValues: {
                ':userId': userId,
                ':category': 'Knowledge'
            },
        };

        console.log('正在查詢用戶收藏:', JSON.stringify(getFavoritesParams));

        try {
            const favoritesResponse = await client.send(new QueryCommand(getFavoritesParams));
            const favorites = favoritesResponse.Items;

            if (!favorites || favorites.length === 0) {
                console.warn('未找到用戶收藏:', userId);
                return res.status(404).json({ message: '未找到收藏的知識庫文章' });
            }

            const articleIds = favorites.map(fav => fav.article_id);

            const batchGetParams = {
                RequestItems: {
                    [KNOWLEDGE_TABLE]: {
                        Keys: articleIds.map(article_id => ({ article_id })),
                    },
                },
            };

            console.log('正在批量查詢知識庫文章資料:', JSON.stringify(batchGetParams));
            const knowledgeResponse = await client.send(new BatchGetCommand(batchGetParams));

            const knowledgeArticles = knowledgeResponse.Responses?.[KNOWLEDGE_TABLE] || [];
            
            // 只保留能在知識庫資料表中找到對應文章的收藏
            const validResponseItems = favorites
                .map(fav => {
                    const knowledge = knowledgeArticles.find(a => a.article_id === fav.article_id);
                    if (!knowledge) {
                        console.warn(`收藏的文章 ${fav.article_id} 在知識庫中未找到`);
                        return null;
                    }
                    return {
                        ...fav,
                        ...knowledge,
                    };
                })
                .filter((item): item is NonNullable<typeof item> => item !== null);

            return res.status(200).json({ 
                message: '成功獲取收藏', 
                items: validResponseItems,
                totalCount: validResponseItems.length 
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('查詢用戶收藏時發生錯誤:', error);
                return res.status(500).json({ message: '內部伺服器錯誤', error: error.message });
            } else {
                console.error('未知錯誤:', error);
                return res.status(500).json({ message: '內部伺服器錯誤', error: '未知錯誤' });
            }
        }
    } else {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
} 