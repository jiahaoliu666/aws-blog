import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/common/Navbar';
import { ExtendedSolution } from '@/types/solutionType';
import Card from '@/components/common/Card';
import Search from '@/components/common/Search';
import { Filters } from '@/components/common/Filters';
import Pagination from '@/components/common/Pagination';
import useSolutionsPageLogic from '@/hooks/solutions/useSolutionsPageLogic';
import Footer from '@/components/common/Footer';
import '@aws-amplify/ui-react/styles.css';
import { useTheme } from '@/context/ThemeContext';
import { useToastContext } from '@/context/ToastContext';

const SolutionsPage: React.FC = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [currentSourcePage, setCurrentSourcePage] = useState<string>('解決方案');
    const { isDarkMode } = useTheme();
    const toast = useToastContext();
    const [searchTerm, setSearchTerm] = useState('');

    const {
        language,
        setLanguage,
        currentSolutions,
        setFilteredSolutions,
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
        filteredSolutions,
        handleDateFilterChange,
        favorites,
        solutions,
    } = useSolutionsPageLogic();

    useEffect(() => {
        const loadData = async () => {
            try {
                console.log('開始加載解決方案數據...');
                // 等待 useSolutionsPageLogic 中的數據加載
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log('當前解決方案數據:', currentSolutions);
                setIsLoading(false);
            } catch (error) {
                console.error('加載數據時出錯:', error);
                setIsLoading(false);
            }
        };

        loadData();
    }, [currentSolutions]);

    useEffect(() => {
        console.log('solutions 數據更新:', solutions);
        console.log('filteredSolutions 數據更新:', filteredSolutions);
        console.log('currentSolutions 數據更新:', currentSolutions);
    }, [solutions, filteredSolutions, currentSolutions]);

    const resetFilters = () => {
        setGridView(false);
        setShowFavorites(false);
        setStartDate('');
        setEndDate('');
        setSortOrder('newest');
        setLanguage('zh-TW');
        setFilteredSolutions([]);
        setShowSummaries(false);
    };



    return (
        <div className={`${isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-900"} flex flex-col min-h-screen overflow-x-hidden`}>
            <Navbar setCurrentSourcePage={setCurrentSourcePage} />
            <div className="container mx-auto px-4 py-8 flex-grow">
                <h1 className="text-5xl font-bold text-center mb-5">AWS 解決方案</h1>
                
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
                    filteredArticles={filteredSolutions}
                    filteredFavoritesCount={filteredFavoritesCount}
                    language={language}
                    setLanguage={setLanguage}
                    toggleShowSummaries={() => setShowSummaries(!showSummaries)}
                    showSummaries={showSummaries}
                    setShowSummaries={setShowSummaries}
                />

                <Search
                    articles={solutions as any[]}
                    setFilteredArticles={setFilteredSolutions as any}
                    isDarkMode={isDarkMode}
                    onSearch={setSearchTerm}
                />

                <div className={`mt-2 grid ${gridView ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "grid-cols-1"} max-w-full`}>
                    {filteredSolutions.length > 0 ? (
                        filteredSolutions.map((solution: ExtendedSolution, index: number) => {
                            const isFavorited = favorites.some(fav => fav.article_id === solution.article_id);
                            return (
                                <Card
                                    key={solution.article_id}
                                    article={{
                                        ...solution,
                                        article_id: solution.article_id,
                                        title: solution.title,
                                        translated_title: solution.translated_title,
                                        description: solution.description,
                                        translated_description: solution.translated_description,
                                        link: solution.link,
                                        info: solution.info,
                                        summary: solution.summary
                                    }}
                                    index={index}
                                    gridView={gridView}
                                    toggleFavorite={() => toggleFavorite(solution)}
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
                    show={filteredSolutions.length > 0}
                />
            </div>
            <Footer />
        </div>
    );
};

export default SolutionsPage; 