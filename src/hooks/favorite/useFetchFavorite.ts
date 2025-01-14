import { useState, useEffect } from 'react';
import { FavoriteItem, FavoriteCollection } from '@/types/favoriteTypes';

const useFetchFavorite = (language: string): FavoriteItem[] => {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const response = await fetch(`/api/favorites?language=${language}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: FavoriteCollection = await response.json();
                
                // 將所有類型的收藏合併成一個數組
                const allFavorites: FavoriteItem[] = [
                    ...data.announcements,
                    ...data.news,
                    ...data.solutions,
                    ...data.architectures
                ].map(favorite => ({
                    ...favorite,
                    isFavorite: true, // 收藏列表中的項目預設為已收藏
                    translated_description: favorite.translated_description || favorite.description,
                    translated_title: favorite.translated_title || favorite.title
                }));

                setFavorites(allFavorites);
            } catch (error) {
                console.error('Error fetching favorites:', error);
            }
        };

        fetchFavorites();
    }, [language]);

    return favorites;
};

export default useFetchFavorite; 