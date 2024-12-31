import { useState, useEffect } from 'react';
import axios from 'axios';
import { ExtendedArchitecture } from '@/types/architectureType';
import { User } from '@/types/userType';
import { useAuth } from '../useAuth';
import { useToastContext } from '@/context/ToastContext';

export const useArchitectureFavorites = () => {
    const { user } = useAuth() as { user: User | null };
    const [favorites, setFavorites] = useState<ExtendedArchitecture[]>([]);
    const toast = useToastContext();

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
                toast.success('已成功移除收藏');
            } else {
                const response = await axios.post('/api/architecture/addFavorite', params);
                if (response.status === 200) {
                    setFavorites((prev) => [{ ...architecture }, ...prev]);
                    toast.success('已成功加入收藏');
                }
            }
        } catch (error) {
            console.error('收藏操作失敗:', error);
            alert('收藏操作失敗，請稍後再試');
        }
    };

    const removeFavorite = async (article: ExtendedArchitecture) => {
        try {
            // 1. 發送 API 請求移除收藏
            const response = await fetch('/api/architecture/removeFavorite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    articleId: article.article_id
                })
            });

            if (!response.ok) {
                throw new Error('移除收藏失敗');
            }

            // 2. 從本地狀態中移除該文章
            setFavorites(prev => 
                prev.filter(fav => fav.article_id !== article.article_id)
            );

            // 3. 觸發成功通知
            toast.success('已從收藏中移除');

        } catch (error) {
            // 4. 錯誤處理
            console.error('移除收藏失敗:', error);
            toast.error('移除收藏失敗，請稍後再試');
        }
    };

    return {
        favorites,
        toggleFavorite,
        setFavorites,
        removeFavorite
    };
}; 