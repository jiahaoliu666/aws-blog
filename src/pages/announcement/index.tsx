import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/common/Navbar';
import { ExtendedAnnouncement } from '../../types/announcementType';
import Card from '../../components/common/Card';
import { Search } from '../../components/common/Search';
import { Filters } from '../../components/common/Filters';
import Pagination from '../../components/common/Pagination';
import useAnnouncementPageLogic from '../../hooks/announcement/useAnnouncementPageLogic';
import Footer from '../../components/common/Footer';
import '@aws-amplify/ui-react/styles.css';
import { useTheme } from '@/context/ThemeContext';
import { useToastContext } from '@/context/ToastContext';
import { ExtendedNews } from '@/types/newsType';
import { FavoriteItem } from '@/types/favoriteTypes';

const AnnouncementPage: React.FC = () => {
    const router = useRouter();
    const [currentSourcePage, setCurrentSourcePage] = useState<string>('最新公告');
    const { isDarkMode } = useTheme();
    const toast = useToastContext();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

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
        showSummaries,
        setShowSummaries,
        handlePageChange,
        toggleFavorite,
        filteredFavoritesCount,
        filteredAnnouncements,
        handleDateFilterChange,
        favorites,
        announcements,
        isLanguageChanging,
    } = useAnnouncementPageLogic();

    useEffect(() => {
        const handleRouteChange = (url: string) => {
            if (url === '/') {
                resetFilters();
            }
        };

        router.events.on('routeChangeComplete', handleRouteChange);
        return () => {
            router.events.off('routeChangeComplete', handleRouteChange);
        };
    }, [router.events]);

    useEffect(() => {
        setCurrentSourcePage('最新公告');
    }, []);

    useEffect(() => {
        resetFilters();
    }, []);

    const resetFilters = () => {
        setGridView(false);
        setShowFavorites(false);
        setStartDate('');
        setEndDate('');
        setSortOrder('newest');
        setLanguage('zh-TW');
        setFilteredAnnouncements([]);
        setShowSummaries(false);
    };

    const toggleShowSummaries = () => {
        setShowSummaries(!showSummaries);
    };

    return (
        <div className={`${isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-900"} flex flex-col min-h-screen overflow-x-hidden`}>
            <Navbar setCurrentSourcePage={setCurrentSourcePage} />
            <div className="container mx-auto px-4 py-8 flex-grow">
                <h1 className="text-5xl font-bold text-center mb-5">AWS 最新公告</h1>
                
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
                    onDateFilterChange={handleDateFilterChange}
                    filteredArticles={filteredAnnouncements}
                    filteredFavoritesCount={filteredFavoritesCount}
                    language={language}
                    setLanguage={setLanguage}
                    toggleShowSummaries={toggleShowSummaries}
                    showSummaries={showSummaries}
                    setShowSummaries={setShowSummaries}
                />

                <Search
                    articles={announcements}
                    setFilteredArticles={setFilteredAnnouncements}
                    isDarkMode={isDarkMode}
                    onSearch={setSearchTerm}
                />

                <div className={`mt-2 grid ${gridView ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "grid-cols-1"} max-w-full`}>
                    {currentAnnouncements.length > 0 ? (
                        currentAnnouncements.map((announcement: ExtendedAnnouncement, index: number) => {
                            const isFavorited = favorites.some((fav: ExtendedAnnouncement) => fav.article_id === announcement.article_id);
                            return (
                                <Card
                                    key={announcement.article_id}
                                    article={announcement}
                                    gridView={gridView}
                                    toggleFavorite={(article) => toggleFavorite(article as ExtendedAnnouncement | ExtendedNews | FavoriteItem)}
                                    language={language}
                                    showSummaries={showSummaries}
                                    isFavorited={isFavorited}
                                    sourcePage={currentSourcePage}
                                    searchTerm={searchTerm}
                                />
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-500 col-span-full">未找到符合條件的文章，請嘗試不同的搜尋條件！</p>
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