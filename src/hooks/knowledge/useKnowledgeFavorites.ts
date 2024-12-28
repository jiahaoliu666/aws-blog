import { useState, useEffect } from 'react';
import axios from 'axios';
import { ExtendedKnowledge } from '@/types/knowledgeType';
import { User } from '@/types/userType';
import { useAuth } from '../useAuth';
import { useToastContext } from '@/context/ToastContext';
export const useKnowledgeFavorites = () => {
    const { user } = useAuth() as { user: User | null };
    const [favorites, setFavorites] = useState<ExtendedKnowledge[]>([]);
    const toast = useToastContext();
    
    useEffect(() => {
        const fetchFavorites = async () => {
            if (user) {
                try {
                    const response = await axios.get(`/api/knowledge/getFavorites?userId=${user.sub}`);
                    setFavorites(response.data.items || []);
                } catch (error) {
                    console.error('獲取收藏知識庫失敗:', error);
                }
            }
        };
        fetchFavorites();
    }, [user]);

    const toggleFavorite = async (knowledge: ExtendedKnowledge) => {
        if (!user) {
            alert('請先登入才能收藏知識！');
            return;
        }

        const params = {
            userId: user.sub,
            articleId: knowledge.article_id,
            title: knowledge.title
        };

        try {
            const isFavorited = favorites.some(
                (fav) => fav.article_id === knowledge.article_id
            );

            if (isFavorited) {
                await axios.post('/api/knowledge/removeFavorite', params);
                setFavorites((prev) =>
                    prev.filter((fav) => fav.article_id !== knowledge.article_id)
                );
                toast.success('已成功移除收藏');
            } else {
                const response = await axios.post('/api/knowledge/addFavorite', params);
                if (response.status === 200) {
                    setFavorites((prev) => [{ ...knowledge }, ...prev]);
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
