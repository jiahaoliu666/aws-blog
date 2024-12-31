import { NextApiRequest, NextApiResponse } from 'next';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import client from '@/libs/dynamodb';

const USER_FAVORITES_TABLE = 'AWS_Blog_UserFavorites';
const ANNOUNCEMENT_TABLE = 'AWS_Blog_Announcement';

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

        console.log('請求參數:', { userId, articleId, title });

        const getAnnouncementParams = {
            TableName: ANNOUNCEMENT_TABLE,
            Key: {
                article_id: articleId,
            },
        };

        try {
            const announcementResponse = await client.send(new GetCommand(getAnnouncementParams));
            const announcementData = announcementResponse.Item;

            if (!announcementData) {
                console.warn('未找到公告:', { articleId, title });
                return res.status(404).json({ message: '未找到公告' });
            }

            const params = {
                TableName: USER_FAVORITES_TABLE,
                Item: {
                    userId,
                    article_id: articleId,
                    createdAt: new Date().toISOString(),
                    category: 'Announcement'
                },
            };

            await client.send(new PutCommand(params));
            console.log('收藏成功:', params.Item);

            return res.status(200).json({ message: '收藏成功', item: { userId, article_id: articleId } });
        } catch (error) {
            console.error('收藏失敗:', {
                error,
                params: getAnnouncementParams,
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