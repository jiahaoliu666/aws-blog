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
import { useToastContext } from '@/context/ToastContext';

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
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [allFavorites, setAllFavorites] = useState<EnhancedFavoriteItem[]>([]);
    const toast = useToastContext();

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
    const memoizedAllFavorites = useMemo(() => {
        const all = [
            ...announcementFavorites.map(item => ({ ...item, type: 'announcement', itemType: 'announcement' })),
            ...newsFavorites.map(item => ({ ...item, type: 'news', itemType: 'news' })),
            ...knowledgeFavorites.map(item => ({ ...item, type: 'knowledge', itemType: 'knowledge' })),
            ...solutionFavorites.map(item => ({ ...item, type: 'solution', itemType: 'solution' })),
            ...architectureFavorites.map(item => ({ ...item, type: 'architecture', itemType: 'architecture' }))
        ] as unknown as EnhancedFavoriteItem[];

        return all;
    }, [announcementFavorites, newsFavorites, knowledgeFavorites, solutionFavorites, architectureFavorites]);

    // 修改分頁和過濾邏輯
    useEffect(() => {
        let filteredItems = selectedType === 'all' 
            ? memoizedAllFavorites 
            : memoizedAllFavorites.filter((item: EnhancedFavoriteItem) => item.type === selectedType);

        // 搜尋過濾邏輯
        if (searchTerm) {
            filteredItems = filteredItems.filter(item => {
                const title = (item.translated_title || item.title || '').toLowerCase();
                const description = (item.translated_description || item.description || '').toLowerCase();
                const info = (item.info || '').toLowerCase();
                const searchLower = searchTerm.toLowerCase();
                
                return title.includes(searchLower) || 
                       description.includes(searchLower) || 
                       info.includes(searchLower);
            });
        }

        // 日期過濾
        if (startDate || endDate) {
            filteredItems = filteredItems.filter(item => {
                const itemDate = extractDateFromInfo(item.info);
                if (!itemDate) return true;
                
                const date = new Date(itemDate);
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate) : null;
                
                if (start && end) {
                    return date >= start && date <= end;
                } else if (start) {
                    return date >= start;
                } else if (end) {
                    return date <= end;
                }
                return true;
            });
        }

        // 排序
        filteredItems.sort((a, b) => {
            const dateA = extractDateFromInfo(a.info)?.toString() || '';
            const dateB = extractDateFromInfo(b.info)?.toString() || '';
            return sortOrder === 'newest' 
                ? dateB.localeCompare(dateA)
                : dateA.localeCompare(dateB);
        });

        setFilteredFavorites(filteredItems);

        // 更新分頁
        const newTotalPages = Math.max(1, Math.ceil(filteredItems.length / 12));
        setTotalPages(newTotalPages);

        // 確保當前頁碼有效
        const validCurrentPage = Math.min(currentPage, newTotalPages);
        if (validCurrentPage !== currentPage) {
            setCurrentPage(validCurrentPage);
        }

        // 更新當前顯示項目
        const startIndex = (validCurrentPage - 1) * 12;
        const endIndex = startIndex + 12;
        setCurrentItems(filteredItems.slice(startIndex, endIndex));

    }, [memoizedAllFavorites, selectedType, searchTerm, currentPage, startDate, endDate, sortOrder]);

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

            // 更新所有相關的收藏狀態
            const updatedAllFavorites = memoizedAllFavorites.filter(
                item => item.article_id !== article.article_id
            );

            // 更新過濾後的收藏列表
            const updatedFilteredFavorites = filteredFavorites.filter(
                item => item.article_id !== article.article_id
            );

            // 如果是最後一篇文章被刪除，重置所有狀態
            if (updatedFilteredFavorites.length === 0) {
                // 重置所有狀態
                setFilteredFavorites([]);
                setCurrentItems([]);
                setCurrentPage(1);
                setTotalPages(1);
                setSelectedType('all');
                setSearchTerm('');
                setStartDate('');
                setEndDate('');
                setSortOrder('newest');
                
                // 更新各類別的收藏狀態
                announcementFavorites.length = 0;
                newsFavorites.length = 0;
                knowledgeFavorites.length = 0;
                solutionFavorites.length = 0;
                architectureFavorites.length = 0;
            } else {
                setFilteredFavorites(updatedFilteredFavorites);
                
                // 計算新的總頁數
                const newTotalPages = Math.max(1, Math.ceil(updatedFilteredFavorites.length / 12));
                setTotalPages(newTotalPages);

                // 如果當前頁面沒有內容且不是第一頁，則回到上一頁
                if (currentPage > newTotalPages) {
                    setCurrentPage(newTotalPages);
                }

                // 更新當前顯示的項目
                const startIndex = (currentPage - 1) * 12;
                const endIndex = startIndex + 12;
                const newCurrentItems = updatedFilteredFavorites.slice(startIndex, endIndex);
                setCurrentItems(newCurrentItems);

                // 更新對應類別的收藏狀態
                const category = article.itemType?.toLowerCase();
                if (category === 'announcement') {
                    announcementFavorites.splice(
                        announcementFavorites.findIndex(item => item.article_id === article.article_id),
                        1
                    );
                } else if (category === 'news') {
                    newsFavorites.splice(
                        newsFavorites.findIndex(item => item.article_id === article.article_id),
                        1
                    );
                } else if (category === 'knowledge') {
                    knowledgeFavorites.splice(
                        knowledgeFavorites.findIndex(item => item.article_id === article.article_id),
                        1
                    );
                } else if (category === 'solution') {
                    solutionFavorites.splice(
                        solutionFavorites.findIndex(item => item.article_id === article.article_id),
                        1
                    );
                } else if (category === 'architecture') {
                    architectureFavorites.splice(
                        architectureFavorites.findIndex(item => item.article_id === article.article_id),
                        1
                    );
                }
            }

            toast.success('已成功移除收藏');

        } catch (error) {
            console.error('移除收藏時發生錯誤:', error);
            toast.error('移除收藏失敗，請稍後再試');
            throw error;
        }
    }, [
        user?.id,
        toast,
        memoizedAllFavorites,
        filteredFavorites,
        currentPage,
        setCurrentPage,
        setFilteredFavorites,
        setCurrentItems,
        setTotalPages,
        setSelectedType,
        setSearchTerm,
        setStartDate,
        setEndDate,
        setSortOrder,
        announcementFavorites,
        newsFavorites,
        knowledgeFavorites,
        solutionFavorites,
        architectureFavorites
    ]);

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
        totalFavorites: memoizedAllFavorites.length,
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
        favorites: memoizedAllFavorites,
        searchTerm,
        setSearchTerm,
    };
}

export default useFavoritePageLogic; 