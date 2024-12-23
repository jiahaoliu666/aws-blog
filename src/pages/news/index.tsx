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
import { Loader } from '@aws-amplify/ui-react'; // 導入 Loader
import '@aws-amplify/ui-react/styles.css';
import { useTheme } from '@/context/ThemeContext';
import { useToastContext } from '@/context/ToastContext';

const NewsPage: React.FC = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true); // 管理加載狀態
    const [currentSourcePage, setCurrentSourcePage] = useState<string>('最新新聞'); // 設置默認值
    const { isDarkMode } = useTheme();
    const toast = useToastContext(); 

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
        // 模擬數據加載過程
        const loadData = async () => {
            // 模擬一個 API 請求或其他異步操作
            await new Promise(resolve => setTimeout(resolve, 1000)); // 模擬 1 秒的加載時間
            setIsLoading(false); // 加載完後設置 isLoading 為 false
        };

        loadData();
    }, []);

    useEffect(() => {
        // 在頁面加載時設置 currentSourcePage
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

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-gray-100">
                <Navbar setCurrentSourcePage={setCurrentSourcePage} /> {/* 傳遞 setCurrentSourcePage */}
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
                />

                <div className={`mt-2 grid ${gridView ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "grid-cols-1"} max-w-full`}>
                    {currentArticles.length > 0 ? (
                        currentArticles.map((article: ExtendedNews, index: number) => {
                            const isFavorited = favorites.some((fav: ExtendedNews) => fav.article_id === article.article_id);
                            return (
                                <Card
                                    key={article.article_id}
                                    article={article}
                                    index={index}
                                    gridView={gridView}
                                    toggleFavorite={toggleFavorite}
                                    language={language}
                                    showSummaries={showSummaries}
                                    isFavorited={isFavorited}
                                    sourcePage={currentSourcePage} // 傳遞 sourcePage
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