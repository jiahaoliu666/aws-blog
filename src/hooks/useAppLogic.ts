// src/hooks/useAppLogic.ts  
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
  const [filteredFavoritesCount, setFilteredFavoritesCount] = useState(0);  

  const toggleShowSummaries = () => setShowSummaries(!showSummaries);  

  const onDateFilterChange = (startDate: string, endDate: string) => {  
    // 處理日期篩選邏輯  
  };  

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
    setFilteredFavoritesCount,  
    onDateFilterChange,  
  };  
};