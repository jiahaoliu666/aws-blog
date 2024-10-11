// src/pages/news/index.tsx  
import React, { useEffect } from 'react';  
import { useRouter } from 'next/router';  
import { News } from '../../types/newsType';  
import NewsCard from '../../components/news/NewsCard';  
import BlogSearch from '../../components/news/NewsSearch';  
import NewsFilters from '../../components/news/NewsFilters';  
import Pagination from '../../components/common/Pagination';  
import useNewsPageLogic from '../../hooks/news/useNewsPageLogic';  

const NewsPage: React.FC = () => {  
  const router = useRouter();  

  // 使用自定義 Hook 管理新聞頁面邏輯  
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
    toggleShowSummaries,  
    handlePageChange,  
    toggleFavorite,  
    filteredFavoritesCount,  
    filteredArticles,  
    handleDateFilterChange  
  } = useNewsPageLogic();  

  useEffect(() => {  
    // 當路由變化時重置狀態的函數  
    const handleRouteChange = (url: string) => {  
      if (url === '/') {  
        // 當導航到首頁時將狀態重置為預設值  
        setGridView(false);  
        setIsDarkMode(false);  
        setShowFavorites(false);  
        setStartDate('');  
        setEndDate('');  
        setSortOrder('newest');  
        setLanguage('zh-TW');  
        setFilteredArticles([]);  
        // 這裡可以加入其他需要重置的狀態  
      }  
    };  

    // 監聽路由變化事件  
    router.events.on('routeChangeComplete', handleRouteChange);  

    // 在組件卸載時清除事件監聽器以防止記憶體洩漏  
    return () => {  
      router.events.off('routeChangeComplete', handleRouteChange);  
    };  
  }, [router.events, setGridView, setIsDarkMode, setShowFavorites, setStartDate, setEndDate, setSortOrder, setLanguage, setFilteredArticles]);  

  return (  
    <div className={`${isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-200 text-gray-900"} flex flex-col min-h-screen`}>  
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
        />  
        <BlogSearch  
          articles={filteredArticles}  
          setFilteredArticles={setFilteredArticles}  
          isDarkMode={isDarkMode}  
        />  
        <div className={`mt-2 grid ${gridView ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "grid-cols-1"}`}>  
          {currentArticles.length > 0 ? (  
            // 遍歷並顯示每篇文章  
            currentArticles.map((article: News, index: number) => (  
              <NewsCard  
                key={index}  
                article={article}  
                index={index}  
                gridView={gridView}  
                isDarkMode={isDarkMode}  
                toggleFavorite={toggleFavorite}  
                language={language}  
                showSummaries={showSummaries}  
              />  
            ))  
          ) : (  
            // 當沒有符合條件的文章時顯示的消息  
            <p className="text-center text-gray-500 col-span-full">未找到符合條件的文章，請嘗試不同的搜尋條件！</p>  
          )}  
        </div>  
        <Pagination  
          currentPage={currentPage}  
          totalPages={totalPages}  
          onPageChange={handlePageChange}  
          show={currentArticles.length > 0}  // 只有當有文章顯示時才顯示分頁  
        />  
      </div>  
    </div>  
  );  
};  

export default NewsPage;