// src/hooks/news/useNewsPageLogic.ts
import { useEffect, useState, useMemo, useCallback } from "react";  
import { ExtendedNews } from "../../types/newsType";  
import useFetchNews from "./useFetchNews";  
import { extractDateFromInfo } from "../../utils/extractDateFromInfo";  
import { useNewsFavorites } from "./useNewsFavorites";  
import { useProfilePreferences } from '@/hooks/profile/useProfilePreferences';
import { useAuthContext } from '@/context/AuthContext';
import { browserStorage } from '@/utils/browserStorage';

function useNewsPageLogic() {  
    const { user } = useAuthContext();
    const { preferences } = useProfilePreferences();
    const [isClient, setIsClient] = useState(false);
    
    // 初始化語言設定
    const [language, setLanguage] = useState<string>('zh-TW'); // 預設值

    // 在客戶端初始化後再讀取 localStorage
    useEffect(() => {
        setIsClient(true);
        const savedLanguage = browserStorage.getItem('newsLanguage');
        if (savedLanguage) {
            setLanguage(savedLanguage);
        } else if (preferences?.language) {
            setLanguage(preferences.language);
        }
    }, [preferences?.language]);

    // 當語言改變時，保存到 localStorage
    useEffect(() => {
        if (isClient) {
            browserStorage.setItem('newsLanguage', language);
        }
    }, [language, isClient]);

    // 從 preferences 初始化狀態，但保持獨立的前端狀態
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

    const articles: ExtendedNews[] = useMemo(() => {  
        return fetchedArticles.map(article => ({  
            ...article,  
            isFavorite: !!favorites.find(fav => fav.article_id === article.article_id),  
            translated_description: article.translated_description || '', 
            translated_title: article.translated_title || '', 
        }));  
    }, [fetchedArticles, favorites, language]);  

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

    const [isLanguageChanging, setIsLanguageChanging] = useState(false);

    const handleLanguageChange = async (newLanguage: string) => {
        setIsLanguageChanging(true);
        try {
            setLanguage(newLanguage);
            browserStorage.setItem('newsLanguage', newLanguage);
            // 等待內容更新
            await new Promise(resolve => setTimeout(resolve, 100));
        } finally {
            setIsLanguageChanging(false);
        }
    };

    const processFavorites = useCallback((articles: ExtendedNews[], favorites: string[]) => {
        // 過濾掉沒有完整資料的文章
        const validArticles = articles.filter(article => 
            article && article.title && article.article_id
        );

        // 只處理有效的文章
        return validArticles.map(article => ({
            ...article,
            isFavorited: favorites.includes(article.article_id)
        }));
    }, []);

    return {  
        language,  
        setLanguage: handleLanguageChange,  
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
        isLanguageChanging,
    };  
}  

export default useNewsPageLogic;
