// src/pages/news/index.tsx
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/common/Navbar';
import { ExtendedNews } from '../../types/newsType';
import NewsCard from '../../components/news/NewsCard';
import BlogSearch from '../../components/news/NewsSearch';
import NewsFilters from '../../components/news/NewsFilters';
import Pagination from '../../components/common/Pagination';
import useNewsPageLogic from '../../hooks/news/useNewsPageLogic';
import Footer from '../../components/common/Footer';

const NewsPage: React.FC = () => {
    const router = useRouter();

    const {
        language,
        setLanguage,
        currentArticles,
        setFilteredArticles,
        currentPage,
        totalPages,
        gridView,
        setGridView,
        isDarkMode,
        setIsDarkMode,
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
        articles, // 確保這裡有完整的文章列表
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

    const resetFilters = () => {
        setGridView(false);
        setIsDarkMode(false);
        setShowFavorites(false);
        setStartDate('');
        setEndDate('');
        setSortOrder('newest');
        setLanguage('zh-TW');
        setFilteredArticles([]);
        setShowSummaries(false);
    };

    return (
        <div className={`${isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-900"} flex flex-col min-h-screen`}>
            <Navbar />
            <div className="container mx-auto px-4 py-8 flex-grow">
                <h1 className="text-5xl font-bold text-center mb-5">AWS 最新新聞</h1>
                
                <NewsFilters
                    gridView={gridView}
                    isDarkMode={isDarkMode}
                    showFavorites={showFavorites}
                    setGridView={setGridView}
                    setIsDarkMode={setIsDarkMode}
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

                <BlogSearch
                    articles={articles} // 使用完整的文章列表
                    setFilteredArticles={setFilteredArticles}
                    isDarkMode={isDarkMode}
                />

                <div className={`mt-2 grid ${gridView ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "grid-cols-1"}`}>
                    {currentArticles.length > 0 ? (
                        currentArticles.map((article: ExtendedNews, index: number) => {
                            const isFavorited = favorites.some((fav: ExtendedNews) => fav.article_id === article.article_id);
                            return (
                                <NewsCard
                                    key={article.article_id}
                                    article={article}
                                    index={index}
                                    gridView={gridView}
                                    isDarkMode={isDarkMode}
                                    toggleFavorite={toggleFavorite}
                                    language={language}
                                    showSummaries={showSummaries}
                                    isFavorited={isFavorited}
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