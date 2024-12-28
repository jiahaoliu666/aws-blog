import { NextApiRequest, NextApiResponse } from 'next';
import { QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import client from '@/libs/dynamodb';

const USER_FAVORITES_TABLE = 'AWS_Blog_UserFavorites';
const TABLE_MAPPING = {
    'News': 'AWS_Blog_News',
    'Knowledge': 'AWS_Blog_Knowledge',
    'Solutions': 'AWS_Blog_Solutions',
    'Announcement': 'AWS_Blog_Announcement',
    'Architecture': 'AWS_Blog_Architecture'
};

type CategoryType = keyof typeof TABLE_MAPPING;

interface FavoriteItem {
    userId: string;
    article_id: string;
    category: CategoryType;
    [key: string]: any;  // 為其他可能的屬性提供彈性
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        const { userId, category } = req.query;

        if (!userId || typeof userId !== 'string') {
            console.warn('請求參數不完整:', { userId });
            return res.status(400).json({ message: '請求參數不完整' });
        }

        // 如果有指定類別，驗證它是否有效
        if (category && typeof category === 'string' && !TABLE_MAPPING[category as CategoryType]) {
            console.warn('無效的類別:', { category });
            return res.status(400).json({ message: '無效的類別' });
        }

        console.log('請求參數:', { userId, category });

        const getFavoritesParams = {
            TableName: USER_FAVORITES_TABLE,
            KeyConditionExpression: 'userId = :userId',
            ...(category && {
                FilterExpression: 'category = :category',
                ExpressionAttributeValues: {
                    ':userId': userId,
                    ':category': category
                },
            }),
            ...(!category && {
                ExpressionAttributeValues: {
                    ':userId': userId
                },
            }),
        };

        console.log('正在查詢用戶收藏:', JSON.stringify(getFavoritesParams));

        try {
            const favoritesResponse = await client.send(new QueryCommand(getFavoritesParams));
            const favorites = favoritesResponse.Items;

            if (!favorites || favorites.length === 0) {
                console.warn('未找到用戶收藏:', userId);
                return res.status(404).json({ message: '未找到收藏的內容' });
            }

            // 按類別分組收藏項目
            const favoritesByCategory = favorites.reduce((acc, fav) => {
                const cat = fav.category as CategoryType;
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(fav);
                return acc;
            }, {} as Record<CategoryType, FavoriteItem[]>);

            // 為每個類別批量獲取文章
            const allResults = await Promise.all(
                Object.entries(favoritesByCategory).map(async ([cat, favs]) => {
                    const tableName = TABLE_MAPPING[cat as CategoryType];
                    const articleIds = favs.map((fav: FavoriteItem) => fav.article_id);

                    const batchGetParams = {
                        RequestItems: {
                            [tableName]: {
                                Keys: articleIds.map((article_id: string) => ({ article_id })),
                            },
                        },
                    };

                    console.log(`正在批量查詢 ${cat} 資料:`, JSON.stringify(batchGetParams));
                    const response = await client.send(new BatchGetCommand(batchGetParams));
                    const articles = response.Responses?.[tableName] || [];

                    return favs.map((fav: FavoriteItem) => {
                        const article = articles.find(a => a.article_id === fav.article_id);
                        return {
                            ...fav,
                            ...article,
                        };
                    });
                })
            );

            const responseItems = allResults.flat();

            return res.status(200).json({ 
                message: '成功獲取收藏', 
                items: responseItems 
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