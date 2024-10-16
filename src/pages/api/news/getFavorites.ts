// // src/pages/api/news/getFavorites.ts
// import { NextApiRequest, NextApiResponse } from 'next';
// import { QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
// import client from '@/libs/dynamodb';

// const USER_FAVORITES_TABLE = 'AWS_Blog_UserFavorites'; // 用戶收藏資料表名稱
// const NEWS_TABLE = 'AWS_Blog_News'; // 新聞文章資料表名稱

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//     if (req.method === 'GET') {
//         const { userId } = req.query;

//         // 檢查請求參數的完整性
//         if (!userId || typeof userId !== 'string') {
//             console.warn('請求參數不完整:', { userId });
//             return res.status(400).json({ message: '請求參數不完整' });
//         }

//         console.log('請求參數:', { userId });

//         // 首先查詢用戶的收藏
//         const getFavoritesParams = {
//             TableName: USER_FAVORITES_TABLE,
//             KeyConditionExpression: 'userId = :userId',
//             ExpressionAttributeValues: {
//                 ':userId': userId,
//             },
//         };

//         console.log('正在查詢用戶收藏:', JSON.stringify(getFavoritesParams));

//         try {
//             const favoritesResponse = await client.send(new QueryCommand(getFavoritesParams));
//             const favorites = favoritesResponse.Items;

//             // 檢查是否有收藏的文章
//             if (!favorites || favorites.length === 0) {
//                 console.warn('未找到用戶收藏:', userId);
//                 return res.status(404).json({ message: '未找到收藏的文章' });
//             }

//             // 獲取所有的 article_id
//             const articleIds = favorites.map(fav => fav.article_id);

//             // 批量查詢文章資料
//             const batchGetParams = {
//                 RequestItems: {
//                     [NEWS_TABLE]: {
//                         Keys: articleIds.map(article_id => ({ article_id })),
//                     },
//                 },
//             };

//             console.log('正在批量查詢文章資料:', JSON.stringify(batchGetParams));
//             const newsResponse = await client.send(new BatchGetCommand(batchGetParams));

//             // 檢查 newsResponse.Responses 是否存在且合乎預期
//             const articles = newsResponse.Responses?.[NEWS_TABLE] || [];

//             // 整合用戶收藏的文章資料
//             const responseItems = favorites.map(fav => {
//                 const article = articles.find(a => a.article_id === fav.article_id);
//                 return {
//                     ...fav,
//                     ...article, // 整合文章詳細資訊
//                 };
//             });

//             return res.status(200).json({ message: '成功獲取收藏', items: responseItems });
//         } catch (error: unknown) {
//             if (error instanceof Error) {
//                 console.error('查詢用戶收藏時發生錯誤:', error);
//                 return res.status(500).json({ message: '內部伺服器錯誤', error: error.message });
//             } else {
//                 console.error('未知錯誤:', error);
//                 return res.status(500).json({ message: '內部伺服器錯誤', error: '未知錯誤' });
//             }
//         }
//     } else {
//         res.setHeader('Allow', ['GET']);
//         return res.status(405).end(`Method ${req.method} Not Allowed`);
//     }
// }


