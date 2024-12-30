import { useEffect, useState, useMemo, useCallback } from "react";
import { ExtendedSolution, Solution } from "@/types/solutionType";
import { extractDateFromInfo } from "@/utils/extractDateFromInfo";
import { useProfilePreferences } from '@/hooks/profile/useProfilePreferences';
import { useAuthContext } from '@/context/AuthContext';
import { browserStorage } from '@/utils/browserStorage';
import useFetchSolutions from "./useFetchSolutions";
import { useSolutionFavorites } from "./useSolutionFavorites";

function useSolutionsPageLogic() {
    const { user } = useAuthContext();
    const { preferences } = useProfilePreferences();
    const [isClient, setIsClient] = useState(false);
    
    const [language, setLanguage] = useState<string>('zh-TW');
    const [gridView, setGridView] = useState<boolean>(preferences?.viewMode === 'grid');
    const [showSummaries, setShowSummaries] = useState<boolean>(preferences?.autoSummarize || false);
    const [showFavorites, setShowFavorites] = useState<boolean>(false);
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [filteredSolutions, setFilteredSolutions] = useState<ExtendedSolution[]>([]);
    const [currentSolutions, setCurrentSolutions] = useState<ExtendedSolution[]>([]);
    const [isLanguageChanging, setIsLanguageChanging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [solutions, setSolutions] = useState<ExtendedSolution[]>([]);

    useEffect(() => {
        setIsClient(true);
        const savedLanguage = browserStorage.getItem('solutionLanguage');
        if (savedLanguage) {
            setLanguage(savedLanguage);
        } else if (preferences?.language) {
            setLanguage(preferences.language);
        }
    }, [preferences?.language]);

    useEffect(() => {
        if (isClient) {
            browserStorage.setItem('solutionLanguage', language);
        }
    }, [language, isClient]);

    const fetchedSolutions = useFetchSolutions(language);
    const { favorites, toggleFavorite } = useSolutionFavorites();

    useEffect(() => {
        const updatedSolutions = fetchedSolutions.map(solution => ({
            ...solution,
            isFavorite: !!favorites.find(fav => fav.article_id === solution.article_id),
        }));
        setSolutions(updatedSolutions);
    }, [fetchedSolutions, favorites]);

    // 分頁和過濾邏輯
    useEffect(() => {
        let updatedSolutions = showFavorites ? favorites : filteredSolutions;

        if (startDate || endDate) {
            updatedSolutions = updatedSolutions.filter(solution => {
                const dateFromInfo = extractDateFromInfo(solution.info);
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate) : null;
                return dateFromInfo && (!start || dateFromInfo >= start) && (!end || dateFromInfo <= end);
            });
        }

        updatedSolutions.sort((a, b) => {
            const dateA = new Date(extractDateFromInfo(a.info) || 0);
            const dateB = new Date(extractDateFromInfo(b.info) || 0);
            return sortOrder === "newest" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
        });

        const newTotalPages = Math.ceil(updatedSolutions.length / 12);
        setTotalPages(newTotalPages);

        const startIndex = (currentPage - 1) * 12;
        const newCurrentSolutions = updatedSolutions.slice(startIndex, startIndex + 12);
        setCurrentSolutions(newCurrentSolutions);

        if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
        }
    }, [filteredSolutions, showFavorites, startDate, endDate, sortOrder, currentPage, favorites]);

    const handlePageChange = useCallback((newPageIndex?: number) => {
        if (newPageIndex && newPageIndex > 0 && newPageIndex <= totalPages) {
            setCurrentPage(newPageIndex);
        }
    }, [totalPages]);

    const handleLanguageChange = async (newLanguage: string) => {
        setIsLanguageChanging(true);
        try {
            setLanguage(newLanguage);
            browserStorage.setItem('solutionLanguage', newLanguage);
            await new Promise(resolve => setTimeout(resolve, 100));
        } finally {
            setIsLanguageChanging(false);
        }
    };

    const processArticles = (articles: ExtendedSolution[]) => {
        return articles.map(article => ({
            ...article,
            info: article.info || '',
            title: article.title,
            translated_title: article.translated_title,
            description: article.description,
            translated_description: article.translated_description,
            link: article.link,
            article_id: article.article_id,
        }));
    };

    const fetchSolutions = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/solutions');
            const data = await response.json();
            
            // 確保處理 info 欄位
            const processedSolutions = data.solutions.map((solution: Solution) => ({
                ...solution,
                info: solution.info || '', // 確保即使沒有 info 也有預設值
            }));

            setSolutions(processedSolutions);
            setFilteredSolutions(processedSolutions);
        } catch (error) {
            console.error('獲取解決方案失敗:', error);
            setError('獲取解決方案失敗，請稍後重試');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        language,
        setLanguage: handleLanguageChange,
        currentSolutions,
        setFilteredSolutions,
        currentPage,
        totalPages,
        gridView,
        setGridView,
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
        filteredSolutions,
        handleDateFilterChange: (start: string, end: string) => {
            setStartDate(start);
            setEndDate(end);
        },
        favorites,
        solutions,
        isLanguageChanging,
        isLoading,
        error,
        fetchSolutions,
    };
}

export default useSolutionsPageLogic; 