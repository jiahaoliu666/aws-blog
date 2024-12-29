import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/common/Navbar';
import { ExtendedKnowledge } from '@/types/knowledgeType';
import Card from '@/components/common/Card';
import Search from '@/components/common/Search';
import { Filters } from '@/components/common/Filters';
import Pagination from '@/components/common/Pagination';
import useKnowledgePageLogic from '@/hooks/knowledge/useKnowledgePageLogic';
import Footer from '@/components/common/Footer';
import '@aws-amplify/ui-react/styles.css';
import { useTheme } from '@/context/ThemeContext';
import { useToastContext } from '@/context/ToastContext';

const KnowledgePage: React.FC = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [currentSourcePage, setCurrentSourcePage] = useState<string>('知識中心');
    const { isDarkMode } = useTheme();
    const toast = useToastContext();
    const [searchTerm, setSearchTerm] = useState('');

    const {
        language,
        setLanguage,
        currentKnowledge,
        setFilteredKnowledge,
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
        filteredKnowledge,
        handleDateFilterChange,
        favorites,
        knowledge,
    } = useKnowledgePageLogic();

    useEffect(() => {
        const loadData = async () => {
            try {
                console.log('開始加載知識中心數據...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log('當前知識中心數據:', currentKnowledge);
                setIsLoading(false);
            } catch (error) {
                console.error('加載數據時出錯:', error);
                setIsLoading(false);
            }
        };

        loadData();
    }, [currentKnowledge]);

    useEffect(() => {
        console.log('knowledge 數據更新:', knowledge);
        console.log('filteredKnowledge 數據更新:', filteredKnowledge);
        console.log('currentKnowledge 數據更新:', currentKnowledge);
    }, [knowledge, filteredKnowledge, currentKnowledge]);

    const resetFilters = () => {
        setGridView(false);
        setShowFavorites(false);
        setStartDate('');
        setEndDate('');
        setSortOrder('newest');
        setLanguage('zh-TW');
        setFilteredKnowledge([]);
        setShowSummaries(false);
    };

    return (
        <div className={`${isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-900"} flex flex-col min-h-screen overflow-x-hidden`}>
            <Navbar setCurrentSourcePage={setCurrentSourcePage} />
            <div className="container mx-auto px-4 py-8 flex-grow">
                <h1 className="text-5xl font-bold text-center mb-5">AWS 知識中心</h1>
                
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
                    filteredArticles={filteredKnowledge}
                    filteredFavoritesCount={filteredFavoritesCount}
                    language={language}
                    setLanguage={setLanguage}
                    toggleShowSummaries={() => setShowSummaries(!showSummaries)}
                    showSummaries={showSummaries}
                    setShowSummaries={setShowSummaries}
                />

                <Search<ExtendedKnowledge>
                    articles={knowledge}
                    setFilteredArticles={setFilteredKnowledge as Dispatch<SetStateAction<ExtendedKnowledge[]>>}
                    isDarkMode={isDarkMode}
                    onSearch={setSearchTerm}
                />

                <div className={`mt-2 grid ${gridView ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "grid-cols-1"} max-w-full`}>
                    {currentKnowledge.length > 0 ? (
                        currentKnowledge.map((article: ExtendedKnowledge, index: number) => {
                            const isFavorited = favorites.some((fav: ExtendedKnowledge) => fav.article_id === article.article_id);
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
                    show={currentKnowledge.length > 0}
                />
            </div>
            <Footer />
        </div>
    );
};

export default KnowledgePage; 