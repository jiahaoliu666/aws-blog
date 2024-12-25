import { useEffect, useState, useMemo, useCallback } from "react";
import { ExtendedSolution } from "@/types/solutionType";
import { extractDateFromInfo } from "@/utils/extractDateFromInfo";
import { useProfilePreferences } from '@/hooks/profile/useProfilePreferences';
import { useAuthContext } from '@/context/AuthContext';
import { browserStorage } from '@/utils/browserStorage';

function useSolutionsPageLogic() {
    const { user } = useAuthContext();
    const { preferences } = useProfilePreferences();
    const [isClient, setIsClient] = useState(false);
    
    // 初始化狀態
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
    const [solutions, setSolutions] = useState<ExtendedSolution[]>([]);
    const [favorites, setFavorites] = useState<ExtendedSolution[]>([]);
    const [isLanguageChanging, setIsLanguageChanging] = useState(false);

    // 語言設置邏輯
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

    const toggleFavorite = useCallback(async (solution: ExtendedSolution) => {
        // 實作收藏切換邏輯
        return Promise.resolve();
    }, []);

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
    };
}

export default useSolutionsPageLogic; 