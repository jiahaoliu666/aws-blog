import { useState, useEffect } from 'react';
import axios from 'axios';
import { ExtendedNews } from '@/types/newsType';
import { FavoriteItem } from '@/types/favoriteTypes';
import { User } from '@/types/userType';
import { useAuth } from '../useAuth';
import { useToastContext } from '@/context/ToastContext';

export const useNewsFavorites = () => {
    const { user } = useAuth() as { user: User | null };
    const [favorites, setFavorites] = useState<ExtendedNews[]>([]);
    const toast = useToastContext();

    useEffect(() => {
        const fetchFavorites = async () => {
            if (user) {
                try {
                    const response = await axios.get(`/api/news/getFavorites?userId=${user.sub}`);
                    setFavorites(response.data.items || []);
                } catch (error) {
                    // console.error('獲取收藏文章失敗:', error);
                }
            }
        };
        fetchFavorites();
    }, [user]);

    const toggleFavorite = async (article: ExtendedNews | FavoriteItem) => {
        if (!user) {
            alert('請先登入才能收藏！');
            return;
        }

        const params = {
            userId: user.sub,
            articleId: article.article_id,
            title: article.title,
            link: article.link,
            description: article.description,
            info: article.info,
            translated_description: article.translated_description,
            translated_title: article.translated_title,
            created_at: article.created_at,
        };

        try {
            if (favorites.some((fav) => fav.article_id === article.article_id)) {
                await removeFavorite(user.sub, article.article_id);
                setFavorites((prev) => prev.filter((fav) => fav.article_id !== article.article_id));
                toast.success('已成功移除收藏');
            } else {
                const response = await axios.post('/api/news/addFavorite', params);
                if (response.status === 200) {
                    setFavorites((prev) => [{
                        ...article,
                        isFavorite: true
                    } as ExtendedNews, ...prev]);
                    toast.success('已成功加入收藏');
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

    return { favorites, toggleFavorite, setFavorites };
};
