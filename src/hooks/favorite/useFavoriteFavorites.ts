import { useState, useEffect } from 'react';
import axios from 'axios';
import { FavoriteItem } from '@/types/favoriteTypes';
import { User } from '@/types/userType';
import { useAuth } from '../useAuth';
import { useToastContext } from '@/context/ToastContext';

export const useFavoriteFavorites = () => {
    const { user } = useAuth() as { user: User | null };
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const toast = useToastContext();

    useEffect(() => {
        const fetchFavorites = async () => {
            if (user) {
                try {
                    const response = await axios.get(`/api/favorite/getFavorites?userId=${user.sub}`);
                    setFavorites(response.data.items || []);
                } catch (error) {
                    console.error('獲取收藏項目失敗:', error);
                }
            }
        };
        fetchFavorites();
    }, [user]);

    const toggleFavorite = async (item: FavoriteItem) => {
        if (!user) {
            alert('請先登入才能收藏！');
            return;
        }

        const params = {
            userId: user.sub,
            articleId: item.article_id,
            title: item.title,
            itemType: item.itemType,
            link: item.link,
            description: item.description,
            info: item.info,
            translated_description: item.translated_description,
            translated_title: item.translated_title,
        };

        try {
            const isFavorited = favorites.some(
                (fav) => fav.article_id === item.article_id
            );

            if (isFavorited) {
                await axios.post('/api/favorite/removeFavorite', params);
                setFavorites((prev) =>
                    prev.filter((fav) => fav.article_id !== item.article_id)
                );
                toast.success('已成功移除收藏');
            } else {
                const response = await axios.post('/api/favorite/addFavorite', params);
                if (response.status === 200) {
                    setFavorites((prev) => [{ ...item }, ...prev]);
                    toast.success('已成功加入收藏');
                }
            }
        } catch (error) {
            console.error('收藏操作失敗:', error);
            alert('收藏操作失敗，請稍後再試');
        }
    };

    return { favorites, toggleFavorite, setFavorites };
}; 