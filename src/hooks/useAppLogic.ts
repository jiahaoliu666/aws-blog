// src/hooks/useAppLogic.ts  
import { useState, useEffect } from 'react';  
import { News } from '@/types/newsType';  

// 自定義 Hook，用於管理應用的全局邏輯狀態  
export const useAppLogic = () => {  
  const [gridView, setGridView] = useState(false);  // 控制是否使用網格視圖  
  const [isDarkMode, setIsDarkMode] = useState(false);  // 控制深色模式  
  const [showFavorites, setShowFavorites] = useState(false);  // 顯示收藏的文章  
  const [startDate, setStartDate] = useState('');  // 開始日期篩選  
  const [endDate, setEndDate] = useState('');  // 結束日期篩選  
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");  // 排序順序，默認為最新  
  const [language, setLanguage] = useState('zh-TW');  // 語言設置，默認為繁體中文  
  const [showSummaries, setShowSummaries] = useState(false);  // 是否顯示摘要  
  const [filteredArticles, setFilteredArticles] = useState<News[]>([]);  // 篩選後的文章列表  
  const [favorites, setFavorites] = useState<News[]>([]);  // 收藏的文章列表
  
  // 切換摘要的顯示狀態  
  const toggleShowSummaries = () => setShowSummaries(!showSummaries);  

  // 處理日期篩選邏輯  
  const onDateFilterChange = (startDate: string, endDate: string) => {  
    setStartDate(startDate);
    setEndDate(endDate);

    // 根據日期篩選文章
    const filtered = favorites.filter(article => {
      const articleDate = new Date(article.info); // 假設 info 包含可轉換為日期的字符串
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      return (!start || articleDate >= start) && (!end || articleDate <= end);
    });

    setFilteredArticles(filtered);
  };  

  // 計算收藏的篩選文章數量
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
    setFavorites,  // 允許更新收藏的文章
  };  
}; 
