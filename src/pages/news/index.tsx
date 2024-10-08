import React, { useEffect, useState } from 'react';  
import { SwitchField, Pagination } from "@aws-amplify/ui-react";  
import "@aws-amplify/ui-react/styles.css";  
import useFetchNews from '../../hooks/useFetchNews';  
import ArticleCard from '../../components/ArticleCard';  
import BlogSearch from '../../components/BlogSearch';  
import { News } from '../../dynamoDB/newsType';  
import { ArrowUp } from 'lucide-react';  

const articlesPerPage = 12;  

const NewsPage: React.FC = () => {  
  const articles = useFetchNews();  
  const [filteredArticles, setFilteredArticles] = useState<News[]>([]);  
  const [currentArticles, setCurrentArticles] = useState<News[]>([]);  
  const [currentPage, setCurrentPage] = useState(1);  
  const [totalPages, setTotalPages] = useState(0);  
  const [gridView, setGridView] = useState<boolean>(false);  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);  
  const [showFavorites, setShowFavorites] = useState<boolean>(false);  
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");  
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);  

  useEffect(() => {  
    let updatedArticles = [...articles];  

    if (showFavorites) {  
      updatedArticles = updatedArticles.filter(article => article.isFavorite);  
    }  

    setFilteredArticles(updatedArticles);  
    setTotalPages(Math.ceil(updatedArticles.length / articlesPerPage));  

    if (currentPage > Math.ceil(updatedArticles.length / articlesPerPage)) {  
      setCurrentPage(Math.ceil(updatedArticles.length / articlesPerPage) || 1);  
    }  
  }, [articles, showFavorites, sortOrder, currentPage]);  

  useEffect(() => {  
    const startIndex = (currentPage - 1) * articlesPerPage;  
    const endIndex = startIndex + articlesPerPage;  
    setCurrentArticles(filteredArticles.slice(startIndex, endIndex));  
  }, [currentPage, filteredArticles]);  

  useEffect(() => {  
    const handleScroll = () => {  
      setShowScrollTop(window.scrollY > 200);  
    };  

    window.addEventListener('scroll', handleScroll);  
    return () => window.removeEventListener('scroll', handleScroll);  
  }, []);  

  const handlePageChange = (newPage: number) => {  
    if (newPage > 0 && newPage <= totalPages) {  
      setCurrentPage(newPage);  
    }  
  };  

  const scrollToTop = () => {  
    window.scrollTo({ top: 0, behavior: 'smooth' });  
  };  

  const toggleFavorite = (article: News) => {  
    const updatedArticles = [...articles];  
    const originalIndex = articles.findIndex((a) => a.title === article.title);  
    if (originalIndex !== -1) {  
      updatedArticles[originalIndex].isFavorite = !updatedArticles[originalIndex].isFavorite;  
      setFilteredArticles(updatedArticles);  
    }  
  };  

  return (  
    <div className={`${isDarkMode ? "bg-gray-800 text-gray-200" : "bg-gray-200 text-gray-900"} flex flex-col min-h-screen`}>  
      <div className="container mx-auto px-4 py-8 flex-grow">  
        <h1 className="text-5xl font-bold text-center mb-6">AWS 最新新聞</h1>  

        <div className="mb-4 flex items-center justify-between">  
          <div className="flex items-center space-x-6">  
            <SwitchField  
              isDisabled={false}  
              label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>切換視圖</span>}  
              labelPosition="start"  
              isChecked={gridView}  
              onChange={(e) => setGridView(e.target.checked)}  
            />  
            <SwitchField  
              isDisabled={false}  
              label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>切換主題</span>}  
              labelPosition="start"  
              isChecked={isDarkMode}  
              onChange={(e) => setIsDarkMode(e.target.checked)}  
            />  
            <SwitchField  
              isDisabled={false}  
              label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>檢視收藏</span>}  
              labelPosition="start"  
              isChecked={showFavorites}  
              onChange={(e) => { setShowFavorites(e.target.checked); setCurrentPage(1); }}  
            />  
            <div className="flex items-center">  
              <label className={`mr-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>排序方式：</label>  
              <select  
                value={sortOrder}  
                onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}  
                className={`border rounded p-1 ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-white text-gray-900"}`}>  
                <option value="newest">最新到最舊</option>  
                <option value="oldest">最舊到最新</option>  
              </select>  
            </div>  
          </div>  
          <div className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>  
            文章數量: {filteredArticles.length}  
          </div>  
        </div>  

        <BlogSearch   
          articles={filteredArticles}   
          setFilteredArticles={setFilteredArticles}   
          isDarkMode={isDarkMode}   
        />  

        <div className={`mt-2 grid ${gridView ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "grid-cols-1"}`}>  
          {currentArticles.length > 0 ? (  
            currentArticles.map((article, index) => (  
              <ArticleCard  
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
      </div>  

      <div className="flex justify-center mt-6 py-4">  
        <Pagination  
          currentPage={currentPage}  
          totalPages={totalPages}  
          onNext={() => handlePageChange(currentPage + 1)}  
          onPrevious={() => handlePageChange(currentPage - 1)}  
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