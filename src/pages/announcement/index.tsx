import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/common/Navbar';
import { ExtendedAnnouncement } from '../../types/announcementType';
import Card from '../../components/common/Card';
import Search from '../../components/common/Search';
import Filters from '../../components/common/Filters';
import Pagination from '../../components/common/Pagination';
import Footer from '../../components/common/Footer';
import { Loader } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useTheme } from '@/context/ThemeContext';
import { useToastContext } from '@/context/ToastContext';
import useAnnouncementPageLogic from '../../hooks/announcement/useAnnouncementPageLogic';

const AnnouncementPage: React.FC = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [currentSourcePage, setCurrentSourcePage] = useState<string>('最新公告');
    const { isDarkMode } = useTheme();
    const toast = useToastContext();

    const {
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
        toggleShowSummaries,
        handlePageChange,
        toggleFavorite,
        filteredFavoritesCount,
        filteredAnnouncements,
        announcements,
        favorites
    } = useAnnouncementPageLogic();

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

                <Filters
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
                    filteredFavoritesCount={filteredFavoritesCount}
                    language={language}
                    setLanguage={setLanguage}
                    toggleShowSummaries={toggleShowSummaries}
                    showSummaries={showSummaries}
                    setShowSummaries={setShowSummaries}
                />

                <Search
                    articles={announcements as any}
                    setFilteredArticles={setFilteredAnnouncements as any}
                    isDarkMode={isDarkMode}
                />

                <div className={`mt-2 grid ${gridView ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "grid-cols-1"} max-w-full`}>
                    {currentAnnouncements.length > 0 ? (
                        currentAnnouncements.map((announcement, index) => {
                            const isFavorited = favorites.some(fav => fav.article_id === announcement.article_id);
                            return (
                                <Card
                                    key={announcement.article_id}
                                    article={announcement as any}
                                    index={index}
                                    gridView={gridView}
                                    toggleFavorite={toggleFavorite as any}
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