import { useState } from 'react';  
import { News } from '@/types/newsType';  

export const useAppLogic = () => {  
  const [gridView, setGridView] = useState(false);  
  const [isDarkMode, setIsDarkMode] = useState(false);  
  const [showFavorites, setShowFavorites] = useState(false);  
  const [startDate, setStartDate] = useState('');  
  const [endDate, setEndDate] = useState('');  
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");  
  const [language, setLanguage] = useState('zh-TW');  
  const [showSummaries, setShowSummaries] = useState(false);  
  const [filteredArticles, setFilteredArticles] = useState<News[]>([]);  
  const [favorites, setFavorites] = useState<News[]>([]);  

  const toggleShowSummaries = () => {
    setShowSummaries(!showSummaries);
    console.log('toggleShowSummaries:', !showSummaries);
  };

  const onDateFilterChange = (startDate: string, endDate: string) => {  
    setStartDate(startDate);
    setEndDate(endDate);
    console.log('onDateFilterChange:', { startDate, endDate });

    const filtered = favorites.filter(article => {
      const articleDate = new Date(article.info);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      return (!start || articleDate >= start) && (!end || articleDate <= end);
    });

    setFilteredArticles(filtered);
    console.log('Filtered Articles:', filtered);
  };  

  const filteredFavoritesCount = showFavorites ? favorites.length : filteredArticles.length;

  return {  
    gridView,  
    setGridView,  
    isDarkMode,  
    setIsDarkMode,  
    showFavorites,  
    setShowFavorites,  
    startDate,  
    setStartDate,  
    endDate,  
    setEndDate,  
    sortOrder,  
    setSortOrder,  
    language,  
    setLanguage,  
    showSummaries,  
    toggleShowSummaries,  
    filteredArticles,  
    setFilteredArticles,  
    filteredFavoritesCount,  
    onDateFilterChange,  
    favorites,  
    setFavorites,  
  };  
}; 
