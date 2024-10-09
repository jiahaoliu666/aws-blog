// src/pages/news/index.tsx  
import React, { useEffect, useState } from 'react';  
import useFetchNews from '../../hooks/useFetchNews';  
import NewsCard from '../../components/news/NewsCard';  
import BlogSearch from '../../components/news/NewsBlogSearch';  
import NewsFilters from '../../components/news/NewsFilters';  
import Pagination from '../../components/Pagination';  
import { News } from '../../dynamoDB/newsType';  
import { ArrowUp } from 'lucide-react';  

const articlesPerPage = 12;  

const NewsPage: React.FC = () => {  
  const articles = useFetchNews();  
  const [filteredArticles, setFilteredArticles] = useState<News[]>(articles || []);  
  const [currentArticles, setCurrentArticles] = useState<News[]>([]);  
  const [currentPage, setCurrentPage] = useState(1);  
  const [totalPages, setTotalPages] = useState(0);  
  const [gridView, setGridView] = useState<boolean>(false);  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);  
  const [showFavorites, setShowFavorites] = useState<boolean>(false);  
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");  
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);  
  const [startDate, setStartDate] = useState<string>("");  
  const [endDate, setEndDate] = useState<string>("");  

  useEffect(() => {  
    setFilteredArticles(articles || []);  
  }, [articles]);  

  const filteredFavoritesCount = filteredArticles.filter(article => article.isFavorite).length;  

  useEffect(() => {  
    let updatedArticles = [...filteredArticles];  

    if (showFavorites) {  
      updatedArticles = updatedArticles.filter(article => article.isFavorite);  
    }  

    if (startDate || endDate) {  
      updatedArticles = updatedArticles.filter(article => {  
        const dateFromInfo = extractDateFromInfo(article.info);  
        const start = startDate ? new Date(startDate) : null;  
        const end = endDate ? new Date(endDate) : null;  

        if (dateFromInfo) {  
          const isAfterStart = start ? dateFromInfo >= start : true;  
          const isBeforeEnd = end ? dateFromInfo <= end : true;  
          return isAfterStart && isBeforeEnd;  
        }  
        return false;  
      });  
    }  

    updatedArticles.sort((a, b) => {  
        const dateA = extractDateFromInfo(a.info);  
        const dateB = extractDateFromInfo(b.info);  

        if (dateA && dateB) {  
            return sortOrder === "newest"   
                ? dateB.getTime() - dateA.getTime()   
                : dateA.getTime() - dateB.getTime();   
        } else if (dateA) {  
            return sortOrder === "newest" ? -1 : 1;   
        } else if (dateB) {  
            return sortOrder === "newest" ? 1 : -1;   
        }  
        return 0;   
    });  

    setTotalPages(Math.ceil(updatedArticles.length / articlesPerPage));  

    if (currentPage > Math.ceil(updatedArticles.length / articlesPerPage)) {  
      setCurrentPage(Math.ceil(updatedArticles.length / articlesPerPage) || 1);  
    }  

    const startIndex = (currentPage - 1) * articlesPerPage;  
    const endIndex = startIndex + articlesPerPage;  
    setCurrentArticles(updatedArticles.slice(startIndex, endIndex));  
  }, [filteredArticles, showFavorites, sortOrder, currentPage, startDate, endDate]);  

  const handlePageChange = (newPageIndex?: number) => {  
    if (newPageIndex && newPageIndex > 0 && newPageIndex <= totalPages) {  
      setCurrentPage(newPageIndex);  
    }  
  };  

  const scrollToTop = () => {  
    window.scrollTo({ top: 0, behavior: 'smooth' });  
  };  

  const toggleFavorite = (article: News) => {  
    const updatedArticles = filteredArticles.map((art) => {  
      if (art.article_id === article.article_id) {  
        return { ...art, isFavorite: !art.isFavorite };  
      }  
      return art;   
    });  

    setFilteredArticles(updatedArticles);   
  };  

  const extractDateFromInfo = (info: string): Date | null => {  
    const dateMatch = info.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);  
    if (dateMatch) {  
        const year = parseInt(dateMatch[1], 10);  
        const month = parseInt(dateMatch[2], 10) - 1;  
        const day = parseInt(dateMatch[3], 10);  
        const date = new Date(year, month, day);  
        return isNaN(date.getTime()) ? null : date;  
    }  
    return null;  
  };  

  const handleDateFilterChange = (start: string, end: string) => {  
    setStartDate(start);  
    setEndDate(end);  
  };  

  return (  
    <div className={`${isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-200 text-gray-900"} flex flex-col min-h-screen`}>  
      <div className="container mx-auto px-4 py-8 flex-grow">  
        <h1 className="text-5xl font-bold text-center mb-8">AWS 最新新聞</h1>  
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
        />  

        <BlogSearch   
          articles={articles}   
          setFilteredArticles={setFilteredArticles}   
          isDarkMode={isDarkMode}   
        />  

        <div className={`mt-2 grid ${gridView ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "grid-cols-1"}`}>  
          {currentArticles.length > 0 ? (  
            currentArticles.map((article, index) => (  
              <NewsCard  
                key={index}  
                article={article}  
                index={index}  
                gridView={gridView}  
                isDarkMode={isDarkMode}  
                toggleFavorite={toggleFavorite}  
              />  
            ))  
          ) : (  
            <p className="text-center text-gray-500 col-span-full">未找到符合條件的文章，請嘗試不同的搜尋條件！</p>  
          )}  
        </div>  

        {/* 傳遞 show 屬性 */}  
        <Pagination   
          currentPage={currentPage}   
          totalPages={totalPages}   
          onPageChange={handlePageChange}  
          show={currentArticles.length > 0} // 根據是否有文章來決定是否顯示  
        />  
      </div>  

      {showScrollTop && (  
        <button  
          className="fixed bottom-8 right-8 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg"  
          onClick={scrollToTop}  
        >  
          <ArrowUp size={24} />  
        </button>  
      )}  
    </div>  
  );  
};  

export default NewsPage;