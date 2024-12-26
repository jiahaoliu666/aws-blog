import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/common/Navbar';
import { ExtendedArchitecture } from '@/types/architectureType';
import Card from '@/components/common/Card';
import Search from '@/components/common/Search';
import { Filters } from '@/components/common/Filters';
import Pagination from '@/components/common/Pagination';
import { useArchitecturePageLogic } from '@/hooks/architecture/useArchitecturePageLogic';
import Footer from '@/components/common/Footer';
import { Loader } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useTheme } from '@/context/ThemeContext';
import { useToastContext } from '@/context/ToastContext';

const ArchitecturePage: React.FC = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [currentSourcePage, setCurrentSourcePage] = useState<string>('架構參考');
    const { isDarkMode } = useTheme();
    const toast = useToastContext();

    const {
        language,
        setLanguage,
        currentArchitectures,
        setFilteredArchitectures,
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
        handlePageChange,
        toggleFavorite,
        filteredFavoritesCount,
        filteredArchitectures,
        handleDateFilterChange,
        favorites,
        architectures,
    } = useArchitecturePageLogic();

    useEffect(() => {
        const loadData = async () => {
            try {
                console.log('開始加載架構參考數據...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log('當前架構參考數據:', currentArchitectures);
                setIsLoading(false);
            } catch (error) {
                console.error('加載數據時出錯:', error);
                setIsLoading(false);
            }
        };

        loadData();
    }, [currentArchitectures]);

    useEffect(() => {
        console.log('architectures 數據更新:', architectures);
        console.log('filteredArchitectures 數據更新:', filteredArchitectures);
        console.log('currentArchitectures 數據更新:', currentArchitectures);
    }, [architectures, filteredArchitectures, currentArchitectures]);

    const resetFilters = () => {
        setGridView(false);
        setShowFavorites(false);
        setStartDate('');
        setEndDate('');
        setSortOrder('newest');
        setLanguage('zh-TW');
        setFilteredArchitectures([]);
        setShowSummaries(false);
    };

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
                <h1 className="text-5xl font-bold text-center mb-5">AWS 架構參考</h1>
                
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
                    filteredArticles={filteredArchitectures}
                    filteredFavoritesCount={filteredFavoritesCount}
                    language={language}
                    setLanguage={setLanguage}
                    toggleShowSummaries={() => setShowSummaries(!showSummaries)}
                    showSummaries={showSummaries}
                    setShowSummaries={setShowSummaries}
                />

                <Search<ExtendedArchitecture>
                    articles={architectures}
                    setFilteredArticles={setFilteredArchitectures}
                    isDarkMode={isDarkMode}
                />

                <div className={`mt-2 grid ${gridView ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "grid-cols-1"} max-w-full`}>
                    {currentArchitectures.length > 0 ? (
                        currentArchitectures.map((architecture: ExtendedArchitecture, index: number) => {
                            const isFavorited = favorites.some((fav: ExtendedArchitecture) => fav.article_id === architecture.article_id);
                            return (
                                <Card
                                    key={architecture.article_id}
                                    article={architecture}
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
                        <p className="text-center text-gray-500 col-span-full">未找到符合條件的架構參考，請嘗試不同的搜尋條件！</p>
                    )}
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    show={currentArchitectures.length > 0}
                />
            </div>
            <Footer />
        </div>
    );
};

export default ArchitecturePage; 