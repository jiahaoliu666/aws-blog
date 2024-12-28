import { useEffect, useState, useMemo, useCallback } from "react";
import { useProfilePreferences } from '@/hooks/profile/useProfilePreferences';
import { useAuthContext } from '@/context/AuthContext';
import { browserStorage } from '@/utils/browserStorage';
import { extractDateFromInfo } from "@/utils/extractDateFromInfo";
import { useAnnouncementFavorites } from "../announcement/useAnnouncementFavorites";
import { useNewsFavorites } from "../news/useNewsFavorites";
import { useKnowledgeFavorites } from "../knowledge/useKnowledgeFavorites";
import { useSolutionFavorites } from "../solutions/useSolutionFavorites";
import { useArchitectureFavorites } from "../architecture/useArchitectureFavorites";
import { FavoriteItem } from "@/types/favoriteTypes";
import { ExtendedNews } from '@/types/newsType';

// 擴展 FavoriteItem 類型
type EnhancedFavoriteItem = FavoriteItem & {
    type: string;
};

function useFavoritePageLogic() {
    const { user } = useAuthContext();
    const { preferences } = useProfilePreferences();
    const [isClient, setIsClient] = useState(false);
    
    // 基本狀態
    const [language, setLanguage] = useState<string>('zh-TW');
    const [gridView, setGridView] = useState<boolean>(preferences?.viewMode === 'grid');
    const [showSummaries, setShowSummaries] = useState<boolean>(preferences?.autoSummarize || false);
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [selectedType, setSelectedType] = useState<string>("all");
    const [currentItems, setCurrentItems] = useState<EnhancedFavoriteItem[]>([]);
    const [isLanguageChanging, setIsLanguageChanging] = useState(false);
    const [showFavorites, setShowFavorites] = useState<boolean>(true);
    const [filteredFavorites, setFilteredFavorites] = useState<EnhancedFavoriteItem[]>([]);

    // 獲取各種類型的收藏
    const { favorites: announcementFavorites } = useAnnouncementFavorites();
    const { favorites: newsFavorites } = useNewsFavorites();
    const { favorites: knowledgeFavorites } = useKnowledgeFavorites();
    const { favorites: solutionFavorites } = useSolutionFavorites();
    const { favorites: architectureFavorites } = useArchitectureFavorites();

    // 初始化客戶端設定
    useEffect(() => {
        setIsClient(true);
        const savedLanguage = browserStorage.getItem('favoriteLanguage');
        if (savedLanguage) {
            setLanguage(savedLanguage);
        } else if (preferences?.language) {
            setLanguage(preferences.language);
        }
    }, [preferences?.language]);

    // 保存語言設定
    useEffect(() => {
        if (isClient) {
            browserStorage.setItem('favoriteLanguage', language);
        }
    }, [language, isClient]);

    // 合併所有收藏項目
    const allFavorites = useMemo(() => {
        const all = [
            ...announcementFavorites.map(item => ({ ...item, type: 'announcement', itemType: 'announcement' })),
            ...newsFavorites.map(item => ({ ...item, type: 'news', itemType: 'news' })),
            ...knowledgeFavorites.map(item => ({ ...item, type: 'knowledge', itemType: 'knowledge' })),
            ...solutionFavorites.map(item => ({ ...item, type: 'solution', itemType: 'solution' })),
            ...architectureFavorites.map(item => ({ ...item, type: 'architecture', itemType: 'architecture' }))
        ] as unknown as EnhancedFavoriteItem[];

        return all;
    }, [announcementFavorites, newsFavorites, knowledgeFavorites, solutionFavorites, architectureFavorites]);

    // 處理分頁和過濾邏輯
    useEffect(() => {
        let filteredItems = selectedType === 'all' 
            ? allFavorites 
            : allFavorites.filter((item: EnhancedFavoriteItem) => item.type === selectedType);

        if (startDate || endDate) {
            filteredItems = filteredItems.filter(item => {
                const dateFromInfo = extractDateFromInfo(item.info);
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate) : null;
                return dateFromInfo && (!start || dateFromInfo >= start) && (!end || dateFromInfo <= end);
            });
        }

        filteredItems.sort((a, b) => {
            const dateA = new Date(extractDateFromInfo(a.info) || 0);
            const dateB = new Date(extractDateFromInfo(b.info) || 0);
            return sortOrder === "newest" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
        });

        const newTotalPages = Math.ceil(filteredItems.length / 12);
        setTotalPages(newTotalPages);

        const startIndex = (currentPage - 1) * 12;
        const newCurrentItems = filteredItems.slice(startIndex, startIndex + 12);
        setCurrentItems(newCurrentItems);

        if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
        }
    }, [allFavorites, selectedType, startDate, endDate, sortOrder, currentPage]);

    const handlePageChange = useCallback((newPageIndex?: number) => {
        if (newPageIndex && newPageIndex > 0 && newPageIndex <= totalPages) {
            setCurrentPage(newPageIndex);
        }
    }, [totalPages]);

    const handleLanguageChange = async (newLanguage: string) => {
        setIsLanguageChanging(true);
        try {
            setLanguage(newLanguage);
            browserStorage.setItem('favoriteLanguage', newLanguage);
            await new Promise(resolve => setTimeout(resolve, 100));
        } finally {
            setIsLanguageChanging(false);
        }
    };

    const toggleFavorite = useCallback(async (article: FavoriteItem) => {
        try {
            const response = await fetch('/api/favorite/removeFavorite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user?.id,
                    articleId: article.article_id,
                }),
            });

            if (!response.ok) {
                throw new Error('移除收藏失敗');
            }

            setCurrentItems(prev => prev.filter(item => item.article_id !== article.article_id));
            setFilteredFavorites(prev => prev.filter(item => item.article_id !== article.article_id));

        } catch (error) {
            console.error('移除收藏時發生錯誤:', error);
            throw error;
        }
    }, [user?.id]);

    // 計算過濾後的收藏數量
    const filteredFavoritesCount = useMemo(() => {
        return filteredFavorites.length;
    }, [filteredFavorites]);

    return {
        language,
        setLanguage: handleLanguageChange,
        currentItems,
        currentPage,
        totalPages,
        gridView,
        setGridView,
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
        selectedType,
        setSelectedType,
        handleDateFilterChange: (start: string, end: string) => {
            setStartDate(start);
            setEndDate(end);
        },
        totalFavorites: allFavorites.length,
        isLanguageChanging,
        favoritesByType: {
            announcement: announcementFavorites,
            news: newsFavorites,
            knowledge: knowledgeFavorites,
            solution: solutionFavorites,
            architecture: architectureFavorites
        },
        showFavorites,
        setShowFavorites,
        filteredFavorites,
        setFilteredFavorites,
        toggleFavorite,
        filteredFavoritesCount,
        favorites: allFavorites,
    };
}

export default useFavoritePageLogic; 