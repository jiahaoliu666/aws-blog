// // src/hooks/news/useNewsPageLogic.ts  

import { useEffect, useState, useMemo, useCallback } from "react";  
import { ExtendedNews } from "../../types/newsType";  
import useFetchNews from "./useFetchNews";  
import { extractDateFromInfo } from "../../utils/extractDateFromInfo";  
import { useNewsFavorites } from "./useNewsFavorites";  

function useNewsPageLogic() {  
  const [language, setLanguage] = useState<string>("zh-TW");  
  const fetchedArticles = useFetchNews(language);  

  const { favorites, toggleFavorite, filteredFavoritesCount, filteredFavoriteArticles } = useNewsFavorites();  

  const articles: ExtendedNews[] = useMemo(() => {  
    return fetchedArticles.map(article => ({  
      ...article,  
      isFavorite: !!favorites[article.article_id]  
    }));  
  }, [fetchedArticles, favorites]);  

  const [filteredArticles, setFilteredArticles] = useState<ExtendedNews[]>([]);  
  const [currentArticles, setCurrentArticles] = useState<ExtendedNews[]>([]);  
  const [currentPage, setCurrentPage] = useState<number>(1);  
  const [totalPages, setTotalPages] = useState<number>(1);  
  const [gridView, setGridView] = useState<boolean>(false);  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);  
  const [showFavorites, setShowFavorites] = useState<boolean>(false);  
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");  
  const [startDate, setStartDate] = useState<string>("");  
  const [endDate, setEndDate] = useState<string>("");  
  const [showSummaries, setShowSummaries] = useState<boolean>(false);  

  useEffect(() => {  
    let updatedArticles = articles;  

    if (showFavorites) {  
      updatedArticles = filteredFavoriteArticles;  
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
      const dateA = new Date(extractDateFromInfo(a.info) || 0);  
      const dateB = new Date(extractDateFromInfo(b.info) || 0);  
      return sortOrder === "newest" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();  
    });  

    if (JSON.stringify(updatedArticles) !== JSON.stringify(filteredArticles)) {  
      setFilteredArticles(updatedArticles);  
    }  

    const newTotalPages = Math.ceil(updatedArticles.length / 12);  
    if (newTotalPages !== totalPages) {  
      setTotalPages(newTotalPages);  
    }  

    const startIndex = (currentPage - 1) * 12;  
    const newCurrentArticles = updatedArticles.slice(startIndex, startIndex + 12);  
    if (JSON.stringify(newCurrentArticles) !== JSON.stringify(currentArticles)) {  
      setCurrentArticles(newCurrentArticles);  
    }  

    if (currentPage > newTotalPages && newTotalPages > 0) {  
      setCurrentPage(newTotalPages);  
    }  
    
  }, [articles, showFavorites, startDate, endDate, sortOrder, currentPage, filteredFavoriteArticles, filteredArticles, totalPages, currentArticles]);  

  const handlePageChange = useCallback((newPageIndex?: number) => {  
    if (newPageIndex && newPageIndex > 0 && newPageIndex <= totalPages) {  
      setCurrentPage(newPageIndex);  
    }  
  }, [totalPages]);  

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
    filteredFavoritesCount,  
    filteredArticles,  
    handleDateFilterChange: (start: string, end: string) => {  
      setStartDate(start);  
      setEndDate(end);  
    },  
  };  
}  

export default useNewsPageLogic;

