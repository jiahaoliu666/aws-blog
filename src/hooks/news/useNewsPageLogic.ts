// src/hooks/news/useNewsPageLogic.ts
import { useEffect, useState, useMemo, useCallback } from "react";  
import { ExtendedNews } from "../../types/newsType";  
import useFetchNews from "./useFetchNews";  
import { extractDateFromInfo } from "../../utils/extractDateFromInfo";  
import { useNewsFavorites } from "./useNewsFavorites";  
import { useProfilePreferences } from '@/hooks/profile/useProfilePreferences';
import { useAuthContext } from '@/context/AuthContext';

function useNewsPageLogic() {  
    const { user } = useAuthContext();
    const { preferences } = useProfilePreferences();
    
    // 從 preferences 初始化狀態，但保持獨立的前端狀態
    const [language, setLanguage] = useState<string>(preferences?.language || "zh-TW");  
    const [gridView, setGridView] = useState<boolean>(preferences?.viewMode === 'grid');
    const [showSummaries, setShowSummaries] = useState<boolean>(preferences?.autoSummarize || false);
    
    // 其他狀態保持不變
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);  
    const [showFavorites, setShowFavorites] = useState<boolean>(false);  
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");  
    const [startDate, setStartDate] = useState<string>("");  
    const [endDate, setEndDate] = useState<string>("");  
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [filteredArticles, setFilteredArticles] = useState<ExtendedNews[]>([]);  
    const [currentArticles, setCurrentArticles] = useState<ExtendedNews[]>([]);  

    const fetchedArticles = useFetchNews(language);  
    const { favorites, toggleFavorite } = useNewsFavorites();  

    // 當 preferences 改變時更新本地狀態
    useEffect(() => {
        if (preferences) {
            setLanguage(preferences.language);
            setGridView(preferences.viewMode === 'grid');
            setShowSummaries(preferences.autoSummarize);
        }
    }, [preferences]);

    const articles: ExtendedNews[] = useMemo(() => {  
        return fetchedArticles.map(article => ({  
            ...article,  
            isFavorite: !!favorites.find(fav => fav.article_id === article.article_id),  
            translated_description: article.translated_description || '', 
            translated_title: article.translated_title || '', 
        }));  
    }, [fetchedArticles, favorites]);  

    useEffect(() => {  
        let updatedArticles: ExtendedNews[] = showFavorites ? favorites : filteredArticles;

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

        const newTotalPages = Math.ceil(updatedArticles.length / 12);  
        setTotalPages(newTotalPages);  

        const startIndex = (currentPage - 1) * 12;  
        const newCurrentArticles = updatedArticles.slice(startIndex, startIndex + 12);  
        setCurrentArticles(newCurrentArticles);  

        if (currentPage > newTotalPages && newTotalPages > 0) {  
            setCurrentPage(newTotalPages);  
        }  
    }, [filteredArticles, showFavorites, startDate, endDate, sortOrder, currentPage, favorites]);  

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
        setShowSummaries,  
        toggleShowSummaries: () => setShowSummaries(v => !v),  
        handlePageChange,  
        toggleFavorite,  
        filteredFavoritesCount: favorites.length,  
        filteredArticles,  
        handleDateFilterChange: (start: string, end: string) => {  
            setStartDate(start);  
            setEndDate(end);  
        },  
        favorites, 
        articles,
    };  
}  

export default useNewsPageLogic;
