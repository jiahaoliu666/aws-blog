import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/common/Navbar';
import { ExtendedNews } from '../../types/newsType';
import Card from '../../components/common/Card';
import Search from '../../components/common/Search';
import { Filters } from '../../components/common/Filters';
import Pagination from '../../components/common/Pagination';
import useNewsPageLogic from '../../hooks/news/useNewsPageLogic';
import Footer from '../../components/common/Footer';
import { useTheme } from '@/context/ThemeContext';
import { useToastContext } from '@/context/ToastContext';
import { useLoading } from '@/context/LoadingContext';
import { FavoriteItem } from '@/types/favoriteTypes';

const NewsPage: React.FC = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [currentSourcePage, setCurrentSourcePage] = useState<string>('最新新聞');
    const { isDarkMode } = useTheme();
    const toast = useToastContext();
    const { startLoading, stopLoading } = useLoading();
    const [searchTerm, setSearchTerm] = useState('');

    const {
        language,
        setLanguage,
        currentArticles,
        setFilteredArticles,
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
        filteredArticles,
        favorites,
        handleDateFilterChange,
        articles,
    } = useNewsPageLogic();

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
        const loadData = async () => {
            try {
                console.log('開始加載新聞數據...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                // console.log('當前新聞數據:', currentArticles);
                setIsLoading(false);
            } catch (error) {
                console.error('加載數據時出錯:', error);
                setIsLoading(false);
            }
        };

        loadData();
    }, [currentArticles]);

    useEffect(() => {
        // console.log('articles 數據更新:', articles);
        // console.log('filteredArticles 數據更新:', filteredArticles);
        // console.log('currentArticles 數據更新:', currentArticles);
    }, [articles, filteredArticles, currentArticles]);

    useEffect(() => {
        setCurrentSourcePage('最新新聞');
    }, []);

    useEffect(() => {
        // 只在組件首次加載時設置默認值
        resetFilters();
    }, []); // 空依賴數組表示只在首次渲染時執行

    const resetFilters = () => {
        setGridView(false);
        setStartDate('');
        setEndDate('');
        setSortOrder('newest');
        setLanguage('zh-TW');
        setFilteredArticles([]);
        setShowSummaries(false);
    };

    useEffect(() => {
        const initializeLanguage = async () => {
            const savedLanguage = localStorage.getItem('newsLanguage');
            if (savedLanguage && savedLanguage !== language) {
                setLanguage(savedLanguage);
            }
        };

        initializeLanguage();
    }, []);

    return (
        <div className={`${isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-900"} flex flex-col min-h-screen overflow-x-hidden`}>
            <Navbar setCurrentSourcePage={setCurrentSourcePage} /> 
            <div className="container mx-auto px-4 py-8 flex-grow">
                <h1 className="text-5xl font-bold text-center mb-5">AWS 最新新聞</h1>
                
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
                    filteredArticles={filteredArticles}
                    filteredFavoritesCount={filteredFavoritesCount}
                    language={language}
                    setLanguage={setLanguage}
                    toggleShowSummaries={toggleShowSummaries}
                    showSummaries={showSummaries}
                    setShowSummaries={setShowSummaries}
                />

                <Search
                    articles={articles}
                    setFilteredArticles={setFilteredArticles}
                    isDarkMode={isDarkMode}
                    onSearch={setSearchTerm}
                />

                <div className={`mt-2 grid ${gridView ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "grid-cols-1"} max-w-full`}>
                    {currentArticles.length > 0 ? (
                        currentArticles.map((article: ExtendedNews, index: number) => {
                            const isFavorited = favorites.some((fav: ExtendedNews) => fav.article_id === article.article_id);
                            return (
                                <Card
                                    key={article.article_id}
                                    article={article}
                                    gridView={gridView}
                                    toggleFavorite={(article) => toggleFavorite(article as ExtendedNews)}
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
                    show={currentArticles.length > 0}
                />
            </div>
            <Footer />
        </div>
    );
};

export default NewsPage;