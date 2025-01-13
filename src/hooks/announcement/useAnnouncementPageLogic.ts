import { useEffect, useState, useMemo, useCallback } from "react";
import { ExtendedAnnouncement, Announcement } from '@/types/announcementType';
import useFetchAnnouncement from "./useFetchAnnouncement";
import { extractDateFromInfo } from "../../utils/extractDateFromInfo";
import { useAnnouncementFavorites } from "./useAnnouncementFavorites";
import { useProfilePreferences } from '@/hooks/profile/useProfilePreferences';
import { useAuthContext } from '@/context/AuthContext';
import { browserStorage } from '@/utils/browserStorage';

function useAnnouncementPageLogic() {
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
    const [filteredAnnouncements, setFilteredAnnouncements] = useState<ExtendedAnnouncement[]>([]);
    const [currentAnnouncements, setCurrentAnnouncements] = useState<ExtendedAnnouncement[]>([]);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setIsClient(true);
        const savedLanguage = browserStorage.getItem('announcementLanguage');
        if (savedLanguage) {
            setLanguage(savedLanguage);
        } else if (preferences?.language) {
            setLanguage(preferences.language);
        }
    }, [preferences]);

    useEffect(() => {
        if (isClient) {
            browserStorage.setItem('announcementLanguage', language);
        }
    }, [language, isClient]);

    const fetchedAnnouncements = useFetchAnnouncement(language);
    const { favorites, toggleFavorite } = useAnnouncementFavorites();

    const announcements: ExtendedAnnouncement[] = useMemo(() => {
        // console.log('Fetched announcements:', fetchedAnnouncements);
        return fetchedAnnouncements.map((announcement: Announcement) => ({
            ...announcement,
            isFavorite: !!favorites.find(fav => fav.article_id === announcement.article_id),
            translated_description: announcement.translated_description || announcement.description || '',
            translated_title: announcement.translated_title || announcement.title || '',
            itemType: 'announcement',
            created_at: announcement.createdAt || announcement.published_at
        }));
    }, [fetchedAnnouncements, favorites, language]);

    useEffect(() => {
        // console.log('Current announcements:', currentAnnouncements);
        // console.log('Filtered announcements:', filteredAnnouncements);
        let updatedAnnouncements: ExtendedAnnouncement[] = showFavorites ? favorites : filteredAnnouncements;

        if (startDate || endDate) {
            updatedAnnouncements = updatedAnnouncements.filter(announcement => {
                const dateFromInfo = extractDateFromInfo(announcement.info);
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate) : null;
                return dateFromInfo && (!start || dateFromInfo >= start) && (!end || dateFromInfo <= end);
            });
        }

        updatedAnnouncements.sort((a, b) => {
            const dateA = new Date(extractDateFromInfo(a.info) || 0);
            const dateB = new Date(extractDateFromInfo(b.info) || 0);
            return sortOrder === "newest" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
        });

        const newTotalPages = Math.ceil(updatedAnnouncements.length / 12);
        setTotalPages(newTotalPages);

        const startIndex = (currentPage - 1) * 12;
        const newCurrentAnnouncements = updatedAnnouncements.slice(startIndex, startIndex + 12);
        setCurrentAnnouncements(newCurrentAnnouncements);

        if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
        }
    }, [filteredAnnouncements, showFavorites, startDate, endDate, sortOrder, currentPage, favorites]);

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
            browserStorage.setItem('announcementLanguage', newLanguage);
            await new Promise(resolve => setTimeout(resolve, 100));
        } finally {
            setIsLanguageChanging(false);
        }
    };

    return {
        language,
        setLanguage: handleLanguageChange,
        currentAnnouncements,
        setFilteredAnnouncements,
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
        setEndDate,
        showSummaries,
        setShowSummaries,
        toggleShowSummaries: () => setShowSummaries(v => !v),
        handlePageChange,
        toggleFavorite,
        filteredFavoritesCount: favorites.length,
        filteredAnnouncements,
        handleDateFilterChange: (start: string, end: string) => {
            setStartDate(start);
            setEndDate(end);
        },
        favorites,
        announcements,
        isLanguageChanging,
    };
}

export default useAnnouncementPageLogic; 