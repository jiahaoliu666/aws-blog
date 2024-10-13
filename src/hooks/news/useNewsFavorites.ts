// src/hooks/news/useNewsFavorites.ts
import { useState } from 'react';  
import { ExtendedNews } from '@/types/newsType';  

export const useNewsFavorites = () => {  
  const [favorites, setFavorites] = useState<Record<string, ExtendedNews>>({});  

  const toggleFavorite = (article: ExtendedNews) => {  
    setFavorites((prevFavorites) => {  
      const isFavorite = !!prevFavorites[article.article_id];  
      const updatedArticle = { ...article, isFavorite: !isFavorite };  

      if (isFavorite) {  
        const newFavorites = { ...prevFavorites };  
        delete newFavorites[article.article_id];  
        return newFavorites;  
      } else {  
        return { ...prevFavorites, [article.article_id]: updatedArticle };  
      }  
    });  
  };  

  const filteredFavoritesCount = Object.keys(favorites).length;  
  const filteredFavoriteArticles = Object.values(favorites);  

  return {  
    favorites,  
    toggleFavorite,  
    filteredFavoritesCount,  
    filteredFavoriteArticles,  
  };  
};


