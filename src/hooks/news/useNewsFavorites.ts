import { useState, useEffect } from 'react';
import axios from 'axios';
import { ExtendedNews } from '@/types/newsType';
import { User } from '@/types/userType';
import { useAuth } from '../useAuth';

export const useNewsFavorites = () => {
    const { user } = useAuth() as { user: User | null };
    const [favorites, setFavorites] = useState<ExtendedNews[]>([]);

    // useEffect(() => {
    //     const fetchFavorites = async () => {
    //         if (user) {
    //             try {
    //                 const response = await axios.get(`/api/news/getFavorites?userId=${user.sub}`);
    //                 setFavorites(response.data.items || []);
    //             } catch (error) {
    //                 // console.error('獲取收藏文章失敗:', error);
    //             }
    //         }
    //     };
    //     fetchFavorites();
    // }, [user]);

    const toggleFavorite = async (article: ExtendedNews) => {
        if (!user) {
            alert('請先登入才能收藏文章！');
            return;
        }

        const articleId = article.article_id;
        const isAlreadyFavorited = favorites.some((fav) => fav.article_id === articleId);

        const params = {
            userId: user.sub,
            articleId,
            title: article.title,
            link: article.link,
            description: article.description,
            info: article.info,
            translated_description: article.translated_description,
            translated_title: article.translated_title,
        };

        try {
            if (isAlreadyFavorited) {
                await removeFavorite(user.sub, articleId);
                setFavorites((prev) => prev.filter((fav) => fav.article_id !== articleId));
                alert('已取消收藏');
            } else {
                const response = await axios.post('/api/news/addFavorite', params);
                if (response.status === 200) {
                    setFavorites((prev) => [{ ...article }, ...prev]);
                    alert('已收藏');
                }
            }
        } catch (error) {
            console.error('錯誤詳情:', error);
            alert('收藏操作失敗，請稍後再試');
        }
    };

    const removeFavorite = async (userId: string, articleId: string) => {
        try {
            await axios.post('/api/news/removeFavorite', { userId, articleId });
        } catch (error) {
            console.error('取消收藏失敗:', error);
        }
    };

    return { favorites, toggleFavorite, setFavorites }; // 確保返回 setFavorites
};
