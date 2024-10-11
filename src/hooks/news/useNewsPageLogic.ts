// src/hooks/news/useNewsPageLogic.ts  
import { useEffect, useState } from "react";  
import { News } from "../../types/newsType";  
import useFetchNews from "./useFetchNews"; // 確保這個 Hook 存在或創建一個替代  

/**  
 * 自定義 Hook，管理新聞頁面的狀態和邏輯。  
 * 包括過濾、排序和分頁功能。  
 */  
function useNewsPageLogic() {  
  const [language, setLanguage] = useState<string>("zh-TW");  
  const articles = useFetchNews(language);  
  const [filteredArticles, setFilteredArticles] = useState<News[]>(articles || []);  
  const [currentArticles, setCurrentArticles] = useState<News[]>([]);  
  const [currentPage, setCurrentPage] = useState<number>(1);  
  const [totalPages, setTotalPages] = useState<number>(0);  
  const [gridView, setGridView] = useState<boolean>(false);  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);  
  const [showFavorites, setShowFavorites] = useState<boolean>(false);  
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");  
  const [startDate, setStartDate] = useState<string>("");  
  const [endDate, setEndDate] = useState<string>("");  
  const [showSummaries, setShowSummaries] = useState<boolean>(false);  

  useEffect(() => {  
    setFilteredArticles(articles || []);  
  }, [articles]);  

  useEffect(() => {  
    let updatedArticles = [...filteredArticles];  
    if (showFavorites) {  
      updatedArticles = updatedArticles.filter(article => article.isFavorite);  
    }  

    if (startDate || endDate) {  
      updatedArticles = updatedArticles.filter(article => {  
        const dateFromInfo = extractDateFromInfo(article.info);  
        const start = startDate ? new Date(startDate) : null;  
        const end = endDate ? new Date(endDate) : null;  
        return dateFromInfo && (!start || dateFromInfo >= start) && (!end || dateFromInfo <= end);  
      });  
    }  

    updatedArticles.sort((a, b) => {  
      const dateA = extractDateFromInfo(a.info);  
      const dateB = extractDateFromInfo(b.info);  
      if (dateA && dateB) {  
        return sortOrder === "newest" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();  
      }  
      return 0;  
    });  

    const totalPagesComputed = Math.ceil(updatedArticles.length / 12);  
    setTotalPages(totalPagesComputed);  

    if (currentPage > totalPagesComputed) {  
      setCurrentPage(totalPagesComputed || 1);  
    }  

    const startIndex = (currentPage - 1) * 12;  
    setCurrentArticles(updatedArticles.slice(startIndex, startIndex + 12));  
  }, [filteredArticles, showFavorites, sortOrder, currentPage, startDate, endDate]);  

  const extractDateFromInfo = (info: string): Date | null => {  
    const dateMatch = info.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);  
    if (dateMatch) {  
      const year = parseInt(dateMatch[1], 10);  
      const month = parseInt(dateMatch[2], 10) - 1;  
      const day = parseInt(dateMatch[3], 10);  
      return new Date(year, month, day);  
    }  
    return null;  
  };  

  const handlePageChange = (newPageIndex?: number) => {  
    if (newPageIndex && newPageIndex > 0 && newPageIndex <= totalPages) {  
      setCurrentPage(newPageIndex);  
    }  
  };  

  const toggleFavorite = (article: News) => {  
    const updatedArticles = filteredArticles.map(art => ({  
      ...art,  
      isFavorite: art.article_id === article.article_id ? !art.isFavorite : art.isFavorite  
    }));  
    setFilteredArticles(updatedArticles);  
  };  

  return {  
    language,  
    setLanguage,  
    currentArticles,  
    setFilteredArticles,  
    currentPage,  
    totalPages,  
    gridView,  
    setGridView,  
    isDarkMode,  
    setIsDarkMode,  
    showFavorites,  
    setShowFavorites,  
    sortOrder,  
    setSortOrder,  
    startDate,  
    endDate,  
    setStartDate,  
    setEndDate,  
    showSummaries,  
    toggleShowSummaries: () => setShowSummaries(v => !v),  
    handlePageChange,  
    toggleFavorite,  
    filteredFavoritesCount: filteredArticles.filter(article => article.isFavorite).length,  
    filteredArticles,  
    handleDateFilterChange: (start: string, end: string) => {  
      setStartDate(start);  
      setEndDate(end);  
    }  
  };  
}  

export default useNewsPageLogic;