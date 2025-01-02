import { useState, useEffect } from 'react';
import axios from 'axios';
import { ExtendedSolution } from '@/types/solutionType';
import { User } from '@/types/userType';
import { useAuth } from '../useAuth';
import { useToastContext } from '@/context/ToastContext';

export const useSolutionFavorites = () => {
    const { user } = useAuth() as { user: User | null };
    const [favorites, setFavorites] = useState<ExtendedSolution[]>([]);
    const toast = useToastContext();

    useEffect(() => {
        const fetchFavorites = async () => {
            if (user) {
                try {
                    const response = await axios.get(`/api/solutions/getFavorites?userId=${user.sub}`);
                    setFavorites(response.data.items || []);
                } catch (error) {
                    console.error('獲取收藏解決方案失敗:', error);
                }
            }
        };
        fetchFavorites();
    }, [user]);

    const toggleFavorite = async (solution: ExtendedSolution) => {
        if (!user) {
            alert('請先登入才能收藏！');
            return;
        }

        const params = {
            userId: user.sub,
            articleId: solution.article_id,
            title: solution.title
        };

        try {
            const isFavorited = favorites.some(
                (fav) => fav.article_id === solution.article_id
            );

            if (isFavorited) {
                await axios.post('/api/solutions/removeFavorite', params);
                setFavorites((prev) =>
                    prev.filter((fav) => fav.article_id !== solution.article_id)
                );
                toast.success('已成功移除收藏');
            } else {
                const response = await axios.post('/api/solutions/addFavorite', params);
                if (response.status === 200) {
                    setFavorites((prev) => [{ ...solution }, ...prev]);
                    toast.success('已成功加入收藏');
                }
            }
        } catch (error: any) {
            console.error('收藏操作失敗:', error);
            toast.error('收藏操作失敗，請稍後再試');
        }
    };

    const removeFavorite = async (solution: ExtendedSolution) => {
        try {
            const response = await fetch('/api/solution/removeFavorite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    articleId: solution.article_id
                })
            });

            if (!response.ok) {
                throw new Error('移除收藏失敗');
            }

            setFavorites(prev => 
                prev.filter(fav => fav.article_id !== solution.article_id)
            );

            toast.success('已從收藏中移除');

        } catch (error: any) {
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
