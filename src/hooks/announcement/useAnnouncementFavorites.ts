import { useState, useEffect } from 'react';
import axios from 'axios';
import { ExtendedAnnouncement } from '@/types/announcementType';
import { User } from '@/types/userType';
import { useAuth } from '../useAuth';
import { useToastContext } from '@/context/ToastContext';
import { ExtendedNews } from '@/types/newsType';
import { FavoriteItem } from '@/types/favoriteTypes';

export const useAnnouncementFavorites = () => {
    const { user } = useAuth() as { user: User | null };
    const [favorites, setFavorites] = useState<ExtendedAnnouncement[]>([]);
    const toast = useToastContext();

    useEffect(() => {
        const fetchFavorites = async () => {
            if (user) {
                try {
                    const response = await axios.get(`/api/announcement/getFavorites?userId=${user.sub}`);
                    setFavorites(response.data.items || []);
                } catch (error) {
                    console.error('獲取收藏公告失敗:', error);
                }
            }
        };
        fetchFavorites();
    }, [user]);

    const toggleFavorite = async (announcement: ExtendedAnnouncement | ExtendedNews | FavoriteItem) => {
        if (!user) {
            alert('請先登入才能收藏！');
            return;
        }

        const params = {
            userId: user.sub,
            articleId: announcement.article_id,
            title: announcement.title
        };

        try {
            const isFavorited = favorites.some(
                (fav) => fav.article_id === announcement.article_id
            );

            if (isFavorited) {
                await axios.post('/api/announcement/removeFavorite', params);
                setFavorites((prev) =>
                    prev.filter((fav) => fav.article_id !== announcement.article_id)
                );
                toast.success('已成功移除收藏');
            } else {
                const response = await axios.post('/api/announcement/addFavorite', params);
                if (response.status === 200) {
                    setFavorites((prev) => [{
                        ...announcement,
                        itemType: 'announcement',
                        published_at: 'published_at' in announcement 
                            ? announcement.published_at 
                            : ('created_at' in announcement 
                                ? announcement.created_at 
                                : new Date().toISOString())
                    } as ExtendedAnnouncement, ...prev]);
                    toast.success('已成功加入收藏');
                }
            }
        } catch (error) {
            console.error('錯誤詳情:', error instanceof Error ? error.message : error);
            alert('收藏操作失敗，請稍後再試');
        }
    };

    return { favorites, toggleFavorite, setFavorites };
}; 