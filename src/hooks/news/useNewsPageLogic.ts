// src/hooks/news/useNewsPageLogic.ts
import { useEffect, useState, useMemo, useCallback } from "react";  
import { ExtendedNews } from "../../types/newsType";  
import useFetchNews from "./useFetchNews";  
import { extractDateFromInfo } from "../../utils/extractDateFromInfo";  
import { useNewsFavorites } from "./useNewsFavorites";  

function useNewsPageLogic() {  
    const [language, setLanguage] = useState<string>("zh-TW");  
    const fetchedArticles = useFetchNews(language);  
    const { favorites, toggleFavorite } = useNewsFavorites();  

    const articles: ExtendedNews[] = useMemo(() => {  
        return fetchedArticles.map(article => ({  
            ...article,  
            isFavorite: !!favorites.find(fav => fav.article_id === article.article_id),  
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
        let updatedArticles: ExtendedNews[] = articles;  

        // 依據是否顯示收藏過濾文章
        if (showFavorites) {  
            updatedArticles = favorites; 
        }  

        // 根據日期篩選文章
        if (startDate || endDate) {  
            updatedArticles = updatedArticles.filter(article => {  
                const dateFromInfo = extractDateFromInfo(article.info);  
                const start = startDate ? new Date(startDate) : null;  
                const end = endDate ? new Date(endDate) : null;  
                return dateFromInfo && (!start || dateFromInfo >= start) && (!end || dateFromInfo <= end);  
            });  
        }  

        // 排序文章
        updatedArticles.sort((a, b) => {  
            const dateA = new Date(extractDateFromInfo(a.info) || 0);  
            const dateB = new Date(extractDateFromInfo(b.info) || 0);  
            return sortOrder === "newest" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();  
        });  

        // 更新過濾文章
        setFilteredArticles(updatedArticles);  

        // 更新總頁數
        const newTotalPages = Math.ceil(updatedArticles.length / 12);  
        setTotalPages(newTotalPages);  

        // 更新當前文章
        const startIndex = (currentPage - 1) * 12;  
        const newCurrentArticles = updatedArticles.slice(startIndex, startIndex + 12);  
        setCurrentArticles(newCurrentArticles);  

        // 重新設定當前頁碼
        if (currentPage > newTotalPages && newTotalPages > 0) {  
            setCurrentPage(newTotalPages);  
        }  
    }, [articles, showFavorites, startDate, endDate, sortOrder, currentPage, favorites]);  

    const handlePageChange = useCallback((newPageIndex?: number) => {  
        if (newPageIndex && newPageIndex > 0 && newPageIndex <= totalPages) {  
            setCurrentPage(newPageIndex);  
        }  
    }, [totalPages]);  

    return {  
        language,  
        setLanguage,  
        currentArticles,  
        setFilteredArticles, // 確保返回此方法
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
        setShowSummaries,  // 確保返回此方法
        toggleShowSummaries: () => setShowSummaries(v => !v),  
        handlePageChange,  
        toggleFavorite,  
        filteredFavoritesCount: favorites.length,  
        filteredArticles,  
        handleDateFilterChange: (start: string, end: string) => {  
            setStartDate(start);  
            setEndDate(end);  
        },  
        favorites, // 添加這行以確保返回 favorites
    };  
}  

export default useNewsPageLogic;
