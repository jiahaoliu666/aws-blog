import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/common/Navbar';
import { ExtendedAnnouncement } from '../../types/announcementType';
import NewsCard from '../../components/news/NewsCard';
import BlogSearch from '../../components/news/NewsSearch';
import NewsFilters from '../../components/news/NewsFilters';
import Pagination from '../../components/common/Pagination';
import Footer from '../../components/common/Footer';
import { Loader } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useTheme } from '@/context/ThemeContext';
import { useToastContext } from '@/context/ToastContext';

type SortOrder = "newest" | "oldest";

const AnnouncementPage: React.FC = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [currentSourcePage, setCurrentSourcePage] = useState<string>('最新公告');
    const { isDarkMode } = useTheme();
    const toast = useToastContext();

    // 使用與 NewsPage 相似的狀態管理
    const [currentPage, setCurrentPage] = useState(1);
    const [gridView, setGridView] = useState(false);
    const [showFavorites, setShowFavorites] = useState(false);
    const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showSummaries, setShowSummaries] = useState(false);
    const [language, setLanguage] = useState('zh-TW');
    const [announcements, setAnnouncements] = useState<ExtendedAnnouncement[]>([]);
    const [filteredAnnouncements, setFilteredAnnouncements] = useState<ExtendedAnnouncement[]>([]);
    const [favorites, setFavorites] = useState<ExtendedAnnouncement[]>([]);

    // 計算分頁
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage);
    const currentAnnouncements = filteredAnnouncements.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page: number | undefined) => {
        if (page) {
            setCurrentPage(page);
            window.scrollTo(0, 0);
        }
    };

    const toggleFavorite = async (announcement: ExtendedAnnouncement) => {
        // 實作收藏功能
        try {
            // 呼叫 API 處理收藏
            toast.success('更新收藏成功');
        } catch (error) {
            toast.error('更新收藏失敗');
        }
    };

    const resetFilters = () => {
        setGridView(false);
        setStartDate('');
        setEndDate('');
        setSortOrder('newest');
        setLanguage('zh-TW');
        setFilteredAnnouncements([]);
        setShowSummaries(false);
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                // 這裡實作獲取公告資料的邏輯
                await new Promise(resolve => setTimeout(resolve, 1000));
                setIsLoading(false);
            } catch (error) {
                toast.error('載入資料失敗');
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-100">
                <Navbar setCurrentSourcePage={setCurrentSourcePage} />
                <div className="flex-grow flex justify-center items-center">
                    <Loader />
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className={`${isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-900"} flex flex-col min-h-screen overflow-x-hidden`}>
            <Navbar setCurrentSourcePage={setCurrentSourcePage} />
            <div className="container mx-auto px-4 py-8 flex-grow">
                <h1 className="text-5xl font-bold text-center mb-5">最新公告</h1>

                <NewsFilters
                    gridView={gridView}
                    showFavorites={showFavorites}
                    setGridView={setGridView}
                    setShowFavorites={setShowFavorites}
                    startDate={startDate}
                    endDate={endDate}
                    setStartDate={setStartDate}
                    setEndDate={setEndDate}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    onDateFilterChange={(start, end) => {
                        setStartDate(start);
                        setEndDate(end);
                    }}
                    filteredArticles={filteredAnnouncements as any}
                    filteredFavoritesCount={favorites.length}
                    language={language}
                    setLanguage={setLanguage}
                    toggleShowSummaries={() => setShowSummaries(!showSummaries)}
                    showSummaries={showSummaries}
                    setShowSummaries={setShowSummaries}
                />

                <BlogSearch
                    articles={announcements as any}
                    setFilteredArticles={setFilteredAnnouncements as any}
                    isDarkMode={isDarkMode}
                />

                <div className={`mt-2 grid ${gridView ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "grid-cols-1"} max-w-full`}>
                    {currentAnnouncements.length > 0 ? (
                        currentAnnouncements.map((announcement, index) => {
                            const isFavorited = favorites.some(fav => fav.article_id === announcement.article_id);
                            return (
                                <NewsCard
                                    key={announcement.article_id}
                                    article={announcement as any}
                                    index={index}
                                    gridView={gridView}
                                    toggleFavorite={toggleFavorite}
                                    language={language}
                                    showSummaries={showSummaries}
                                    isFavorited={isFavorited}
                                    sourcePage={currentSourcePage}
                                />
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-500 col-span-full">未找到符合條件的公告，請嘗試不同的搜尋條件！</p>
                    )}
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    show={currentAnnouncements.length > 0}
                />
            </div>
            <Footer />
        </div>
    );
};

export default AnnouncementPage; 