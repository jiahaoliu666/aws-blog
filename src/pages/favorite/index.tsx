import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/router';
import Navbar from '@/components/common/Navbar';
import Card from '@/components/common/Card';
import Search from '@/components/common/Search';
import { Filters } from '@/components/common/Filters';
import Pagination from '@/components/common/Pagination';
import useFavoritePageLogic from '@/hooks/favorite/useFavoritePageLogic';
import Footer from '@/components/common/Footer';
import '@aws-amplify/ui-react/styles.css';
import { useTheme } from '@/context/ThemeContext';
import { useToastContext } from '@/context/ToastContext';
import { FavoriteItem } from "@/types/favoriteTypes";
import { ExtendedNews } from '@/types/newsType';

type EnhancedFavoriteItem = FavoriteItem & {
    type: string;
};

const FavoritePage: React.FC = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [currentSourcePage, setCurrentSourcePage] = useState<string>('收藏文章');
    const { isDarkMode } = useTheme();
    const toast = useToastContext();
    const [searchTerm, setSearchTerm] = useState('');

    const {
        language,
        setLanguage,
        currentItems,
        setFilteredFavorites,
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
        handlePageChange,
        toggleFavorite,
        filteredFavoritesCount,
        filteredFavorites,
        handleDateFilterChange,
        favorites,
        showFavorites,
        setShowFavorites,
    } = useFavoritePageLogic();

    useEffect(() => {
        const loadData = async () => {
            try {
                console.log('開始加載收藏數據...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                // console.log('當前收藏數據:', currentItems);
                setIsLoading(false);
            } catch (error) {
                console.error('加載數據時出錯:', error);
                setIsLoading(false);
            }
        };

        loadData();
    }, [currentItems]);

    useEffect(() => {
        // console.log('favorites 數據更新:', favorites);
        // console.log('filteredFavorites 數據更新:', filteredFavorites);
        // console.log('currentItems 數據更新:', currentItems);
    }, [favorites, filteredFavorites, currentItems]);

    const resetFilters = () => {
        setGridView(false);
        setStartDate('');
        setEndDate('');
        setSortOrder('newest');
        setLanguage('zh-TW');
        setFilteredFavorites([]);
        setShowSummaries(false);
    };

    const handleFavoriteRemoved = async (article: ExtendedNews | FavoriteItem) => {
        try {
            await toggleFavorite(article as FavoriteItem);
        } catch (error) {
            console.error('移除收藏失敗:', error);
        }
    };

    const handleSearch = (searchTerm: string) => {
        setSearchTerm(searchTerm);
        
        if (!searchTerm) {
            // 如果搜尋詞為空，顯示所有文章
            setFilteredFavorites(favorites);
        } else {
            // 過濾符合搜尋條件的文章
            const filtered = favorites.filter(article => {
                const title = article.title?.toLowerCase() || '';
                const translatedTitle = article.translated_title?.toLowerCase() || '';
                const description = article.description?.toLowerCase() || '';
                const translatedDescription = article.translated_description?.toLowerCase() || '';
                
                return title.includes(searchTerm.toLowerCase()) ||
                       translatedTitle.includes(searchTerm.toLowerCase()) ||
                       description.includes(searchTerm.toLowerCase()) ||
                       translatedDescription.includes(searchTerm.toLowerCase());
            });
            
            setFilteredFavorites(filtered);
        }
    };

    return (
        <div className={`${isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-900"} flex flex-col min-h-screen overflow-x-hidden`}>
            <Navbar setCurrentSourcePage={setCurrentSourcePage} />
            <div className="container mx-auto px-4 py-8 flex-grow">
                <h1 className="text-5xl font-bold text-center mb-5">收藏文章</h1>
                
                <Filters
                    gridView={gridView}
                    setGridView={setGridView}
                    showFavorites={showFavorites}
                    setShowFavorites={setShowFavorites}
                    startDate={startDate}
                    endDate={endDate}
                    setStartDate={setStartDate}
                    setEndDate={setEndDate}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    onDateFilterChange={handleDateFilterChange}
                    filteredArticles={filteredFavorites}
                    filteredFavoritesCount={filteredFavoritesCount}
                    language={language}
                    setLanguage={setLanguage}
                    toggleShowSummaries={() => setShowSummaries(!showSummaries)}
                    showSummaries={showSummaries}
                    setShowSummaries={setShowSummaries}
                    currentPage="收藏文章"
                />

                <Search<EnhancedFavoriteItem>
                    articles={currentItems}
                    setFilteredArticles={setFilteredFavorites}
                    isDarkMode={isDarkMode}
                    onSearch={handleSearch}
                />

                <div className={`mt-2 grid ${gridView ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "grid-cols-1"} max-w-full`}>
                    {filteredFavorites.length > 0 ? (
                        filteredFavorites.map((item, index) => (
                            <Card
                                key={item.article_id}
                                article={item}
                                gridView={gridView}
                                language={language}
                                showSummaries={showSummaries}
                                toggleFavorite={(article) => toggleFavorite(article as FavoriteItem)}
                                isFavorited={true}
                                sourcePage="收藏文章"
                                searchTerm={searchTerm}
                            />
                        ))
                    ) : (
                        <p className="text-center text-gray-500 col-span-full">未找到符合條件的文章，請嘗試不同的搜尋條件！</p>
                    )}
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    show={filteredFavorites.length > 0}
                />
            </div>
            <Footer />
        </div>
    );
};

export default FavoritePage; 