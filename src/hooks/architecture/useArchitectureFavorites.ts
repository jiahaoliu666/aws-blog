import { useState, useEffect } from 'react';
import axios from 'axios';
import { ExtendedArchitecture } from '@/types/architectureType';
import { User } from '@/types/userType';
import { useAuth } from '../useAuth';

export const useArchitectureFavorites = () => {
    const { user } = useAuth() as { user: User | null };
    const [favorites, setFavorites] = useState<ExtendedArchitecture[]>([]);

    useEffect(() => {
        const fetchFavorites = async () => {
            if (user) {
                try {
                    const response = await axios.get(`/api/architecture/getFavorites?userId=${user.sub}`);
                    setFavorites(response.data.items || []);
                } catch (error) {
                    console.error('獲取收藏架構失敗:', error);
                }
            }
        };
        fetchFavorites();
    }, [user]);

    const toggleFavorite = async (architecture: ExtendedArchitecture) => {
        if (!user) {
            alert('請先登入才能收藏架構！');
            return;
        }

        const params = {
            userId: user.sub,
            articleId: architecture.article_id,
            title: architecture.title
        };

        try {
            const isFavorited = favorites.some(
                (fav: ExtendedArchitecture) => fav.article_id === architecture.article_id
            );

            if (isFavorited) {
                await axios.post('/api/architecture/removeFavorite', params);
                setFavorites((prev) =>
                    prev.filter((fav) => fav.article_id !== architecture.article_id)
                );
                alert('已取消收藏');
            } else {
                const response = await axios.post('/api/architecture/addFavorite', params);
                if (response.status === 200) {
                    setFavorites((prev) => [{ ...architecture }, ...prev]);
                    alert('已收藏');
                }
            }
        } catch (error) {
            console.error('收藏操作失敗:', error);
            alert('收藏操作失敗，請稍後再試');
        }
    };

    return { favorites, toggleFavorite, setFavorites };
}; 