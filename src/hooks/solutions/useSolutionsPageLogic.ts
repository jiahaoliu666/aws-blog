import { useEffect, useState, useMemo, useCallback } from "react";
import { ExtendedSolution } from "@/types/solutionType";
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

    const solutions = useMemo(() => {
        return fetchedSolutions.map(solution => ({
            ...solution,
            isFavorite: !!favorites.find(fav => fav.article_id === solution.article_id),
        }));
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