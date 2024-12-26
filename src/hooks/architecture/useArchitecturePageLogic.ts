import { useEffect, useState, useMemo, useCallback } from "react";
import { Architecture, ExtendedArchitecture } from "@/types/architectureType";
import { extractDateFromInfo } from "@/utils/extractDateFromInfo";
import { useProfilePreferences } from '@/hooks/profile/useProfilePreferences';
import { useAuthContext } from '@/context/AuthContext';
import { browserStorage } from '@/utils/browserStorage';
import useFetchArchitecture from "./useFetchArchitecture";
import { useArchitectureFavorites } from "./useArchitectureFavorites";

export const useArchitecturePageLogic = () => {
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
    const [filteredArchitectures, setFilteredArchitectures] = useState<ExtendedArchitecture[]>([]);
    const [currentArchitectures, setCurrentArchitectures] = useState<ExtendedArchitecture[]>([]);
    const [isLanguageChanging, setIsLanguageChanging] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const savedLanguage = browserStorage.getItem('architectureLanguage');
        if (savedLanguage) {
            setLanguage(savedLanguage);
        } else if (preferences?.language) {
            setLanguage(preferences.language);
        }
    }, [preferences?.language]);

    useEffect(() => {
        if (isClient) {
            browserStorage.setItem('architectureLanguage', language);
        }
    }, [language, isClient]);

    const fetchedArchitectures = useFetchArchitecture(language);
    const { favorites, toggleFavorite } = useArchitectureFavorites();

    const architectures = useMemo(() => {
        return fetchedArchitectures.map((architecture: Architecture) => ({
            ...architecture,
            isFavorite: !!favorites.find((fav: ExtendedArchitecture) => fav.article_id === architecture.article_id),
            translated_description: architecture.translated_description || architecture.description || '',
            translated_title: architecture.translated_title || architecture.title || '',
        }));
    }, [fetchedArchitectures, favorites, language]);

    useEffect(() => {
        let updatedArchitectures = showFavorites ? favorites : filteredArchitectures;

        if (startDate || endDate) {
            updatedArchitectures = updatedArchitectures.filter((architecture: ExtendedArchitecture) => {
                const dateFromInfo = extractDateFromInfo(architecture.info);
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate) : null;
                return dateFromInfo && (!start || dateFromInfo >= start) && (!end || dateFromInfo <= end);
            });
        }

        updatedArchitectures.sort((a: ExtendedArchitecture, b: ExtendedArchitecture) => {
            const dateA = new Date(extractDateFromInfo(a.info) || 0);
            const dateB = new Date(extractDateFromInfo(b.info) || 0);
            return sortOrder === "newest" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
        });

        const newTotalPages = Math.ceil(updatedArchitectures.length / 12);
        setTotalPages(newTotalPages);

        const startIndex = (currentPage - 1) * 12;
        const newCurrentArchitectures = updatedArchitectures.slice(startIndex, startIndex + 12);
        setCurrentArchitectures(newCurrentArchitectures);

        if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
        }
    }, [filteredArchitectures, showFavorites, startDate, endDate, sortOrder, currentPage, favorites]);

    const handlePageChange = useCallback((newPageIndex?: number) => {
        if (newPageIndex && newPageIndex > 0 && newPageIndex <= totalPages) {
            setCurrentPage(newPageIndex);
        }
    }, [totalPages]);

    const handleLanguageChange = async (newLanguage: string) => {
        setIsLanguageChanging(true);
        try {
            setLanguage(newLanguage);
            browserStorage.setItem('architectureLanguage', newLanguage);
            await new Promise(resolve => setTimeout(resolve, 100));
        } finally {
            setIsLanguageChanging(false);
        }
    };

    return {
        language,
        setLanguage: handleLanguageChange,
        currentArchitectures,
        setFilteredArchitectures,
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
        filteredArchitectures,
        handleDateFilterChange: (start: string, end: string) => {
            setStartDate(start);
            setEndDate(end);
        },
        favorites,
        architectures,
        isLanguageChanging,
    };
}; 