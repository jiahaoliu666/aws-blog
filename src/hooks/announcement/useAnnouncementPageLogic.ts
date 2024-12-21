import { useEffect, useState, useMemo, useCallback } from "react";
import { ExtendedAnnouncement } from "../../types/announcementType";
import { extractDateFromInfo } from "../../utils/extractDateFromInfo";
import { useProfilePreferences } from '@/hooks/profile/useProfilePreferences';
import { useAuthContext } from '@/context/AuthContext';
import { browserStorage } from '@/utils/browserStorage';

function useAnnouncementPageLogic() {
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
    const [announcements, setAnnouncements] = useState<ExtendedAnnouncement[]>([]);
    const [filteredAnnouncements, setFilteredAnnouncements] = useState<ExtendedAnnouncement[]>([]);
    const [currentAnnouncements, setCurrentAnnouncements] = useState<ExtendedAnnouncement[]>([]);
    const [favorites, setFavorites] = useState<ExtendedAnnouncement[]>([]);

    // 在客戶端初始化後讀取設定
    useEffect(() => {
        setIsClient(true);
        const savedLanguage = browserStorage.getItem('announcementLanguage');
        if (savedLanguage) {
            setLanguage(savedLanguage);
        } else if (preferences?.language) {
            setLanguage(preferences.language);
        }
    }, [preferences?.language]);

    // 處理分頁和篩選邏輯
    useEffect(() => {
        let updatedAnnouncements = showFavorites ? favorites : filteredAnnouncements;

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

    const toggleFavorite = async (announcement: ExtendedAnnouncement): Promise<void> => {
        try {
            // 實作收藏功能
            const newFavorites = [...favorites];
            const index = newFavorites.findIndex(fav => fav.article_id === announcement.article_id);
            
            if (index === -1) {
                newFavorites.push(announcement);
            } else {
                newFavorites.splice(index, 1);
            }
            
            setFavorites(newFavorites);
            return;
        } catch (error) {
            console.error('更新收藏失敗:', error);
            return;
        }
    };

    return {
        language,
        setLanguage,
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
        setStartDate,
        setEndDate,
        showSummaries,
        setShowSummaries,
        toggleShowSummaries: () => setShowSummaries(v => !v),
        handlePageChange: (page: number | undefined) => {
            if (page) setCurrentPage(page);
        },
        toggleFavorite,
        filteredFavoritesCount: favorites.length,
        filteredAnnouncements,
        announcements,
        favorites
    };
}

export default useAnnouncementPageLogic; 