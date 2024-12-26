import { useEffect, useState, useMemo, useCallback } from "react";
import { ExtendedKnowledge } from "@/types/knowledgeType";
import { extractDateFromInfo } from "@/utils/extractDateFromInfo";
import { useProfilePreferences } from '@/hooks/profile/useProfilePreferences';
import { useAuthContext } from '@/context/AuthContext';
import { browserStorage } from '@/utils/browserStorage';
import useFetchKnowledge from "./useFetchKnowledge";
import { useKnowledgeFavorites } from "./useKnowledgeFavorites";

function useKnowledgePageLogic() {
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
    const [filteredKnowledge, setFilteredKnowledge] = useState<ExtendedKnowledge[]>([]);
    const [currentKnowledge, setCurrentKnowledge] = useState<ExtendedKnowledge[]>([]);
    const [isLanguageChanging, setIsLanguageChanging] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const savedLanguage = browserStorage.getItem('knowledgeLanguage');
        if (savedLanguage) {
            setLanguage(savedLanguage);
        } else if (preferences?.language) {
            setLanguage(preferences.language);
        }
    }, [preferences?.language]);

    useEffect(() => {
        if (isClient) {
            browserStorage.setItem('knowledgeLanguage', language);
        }
    }, [language, isClient]);

    const fetchedKnowledge = useFetchKnowledge(language);
    const { favorites, toggleFavorite } = useKnowledgeFavorites();

    const knowledge = useMemo(() => {
        return fetchedKnowledge.map(item => ({
            ...item,
            isFavorite: !!favorites.find(fav => fav.article_id === item.article_id),
            translated_description: item.translated_description || item.description || '',
            translated_title: item.translated_title || item.title || '',
        }));
    }, [fetchedKnowledge, favorites, language]);

    useEffect(() => {
        let updatedKnowledge = showFavorites ? favorites : filteredKnowledge;

        if (startDate || endDate) {
            updatedKnowledge = updatedKnowledge.filter(item => {
                const dateFromInfo = extractDateFromInfo(item.info);
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate) : null;
                return dateFromInfo && (!start || dateFromInfo >= start) && (!end || dateFromInfo <= end);
            });
        }

        updatedKnowledge.sort((a, b) => {
            const dateA = new Date(extractDateFromInfo(a.info) || 0);
            const dateB = new Date(extractDateFromInfo(b.info) || 0);
            return sortOrder === "newest" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
        });

        const newTotalPages = Math.ceil(updatedKnowledge.length / 12);
        setTotalPages(newTotalPages);

        const startIndex = (currentPage - 1) * 12;
        const newCurrentKnowledge = updatedKnowledge.slice(startIndex, startIndex + 12);
        setCurrentKnowledge(newCurrentKnowledge);

        if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
        }
    }, [filteredKnowledge, showFavorites, startDate, endDate, sortOrder, currentPage, favorites]);

    const handlePageChange = useCallback((newPageIndex?: number) => {
        if (newPageIndex && newPageIndex > 0 && newPageIndex <= totalPages) {
            setCurrentPage(newPageIndex);
        }
    }, [totalPages]);

    const handleLanguageChange = async (newLanguage: string) => {
        setIsLanguageChanging(true);
        try {
            setLanguage(newLanguage);
            browserStorage.setItem('knowledgeLanguage', newLanguage);
            await new Promise(resolve => setTimeout(resolve, 100));
        } finally {
            setIsLanguageChanging(false);
        }
    };

    return {
        language,
        setLanguage: handleLanguageChange,
        currentKnowledge,
        setFilteredKnowledge,
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
        filteredKnowledge,
        handleDateFilterChange: (start: string, end: string) => {
            setStartDate(start);
            setEndDate(end);
        },
        favorites,
        knowledge,
        isLanguageChanging,
    };
}

export default useKnowledgePageLogic; 