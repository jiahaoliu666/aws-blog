import React, { useEffect, useState } from 'react';  
import { ArrowUp } from 'lucide-react';  
import { SearchField, SwitchField, Pagination } from "@aws-amplify/ui-react";  
import "@aws-amplify/ui-react/styles.css";  

interface Article {  
  title: string;  
  description: string;  
  info?: string;   
  isFavorite: boolean;  
  createdAt: string;  
  author: string;  
  link: string;   
}  

const articlesPerPage = 12;  

const NewsPage: React.FC = () => {  
  const [articles, setArticles] = useState<Article[]>([]);  
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);  
  const [currentArticles, setCurrentArticles] = useState<Article[]>([]);  
  const [currentPage, setCurrentPage] = useState(1);  
  const [totalPages, setTotalPages] = useState(0);  
  const [gridView, setGridView] = useState<boolean>(false);  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);  
  const [showFavorites, setShowFavorites] = useState<boolean>(false);  
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");  
  const [searchValue, setSearchValue] = useState<string>("");  
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);  

  useEffect(() => {  
    const fetchArticles = async () => {  
      try {  
        const response = await fetch('/api/news');  
        if (!response.ok) throw new Error('Network response was not ok');  
        const data = await response.json();  

        const articlesWithDefaults: Article[] = data.map((article: any) => ({  
          title: article.title,  
          description: article.description,  
          info: article.info || '',   
          isFavorite: false,  
          createdAt: article.createdAt || new Date().toISOString(),  
          author: article.author || '未知',  
          link: article.link || '#',  
        }));  

        setArticles(articlesWithDefaults);  
      } catch (error) {  
        console.error('獲取文章時發生錯誤:', error);  
      }  
    };  

    fetchArticles();  
  }, []);  

  useEffect(() => {  
    let updatedArticles = [...articles];  

    if (showFavorites) {  
      updatedArticles = updatedArticles.filter(article => article.isFavorite);  
    }  

    if (searchValue) {  
      updatedArticles = updatedArticles.filter(article =>  
        article.title.toLowerCase().includes(searchValue.toLowerCase())  
      );  
    }  

    updatedArticles.sort((a, b) => {  
      return sortOrder === "newest"  
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()  
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();  
    });  

    setFilteredArticles(updatedArticles);  
    setTotalPages(Math.ceil(updatedArticles.length / articlesPerPage));  

    if (currentPage > Math.ceil(updatedArticles.length / articlesPerPage)) {  
      setCurrentPage(Math.ceil(updatedArticles.length / articlesPerPage) || 1);  
    }  
  }, [articles, showFavorites, searchValue, sortOrder, currentPage]);  

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

  useEffect(() => {  
    const handleKeyDown = (event: KeyboardEvent) => {  
      switch (event.key) {  
        case 'ArrowUp':  
          scrollToTop();  
          break;  
        case 'ArrowRight':  
          handlePageChange(currentPage + 1);  
          break;  
        case 'ArrowLeft':  
          handlePageChange(currentPage - 1);  
          break;  
        default:  
          break;  
      }  
    };  

    window.addEventListener('keydown', handleKeyDown);  

    return () => {  
      window.removeEventListener('keydown', handleKeyDown);  
    };  
  }, [currentPage, totalPages]);  

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {  
    setSearchValue(e.target.value);  
  };  

  const toggleFavorite = (article: Article) => {  
    const updatedArticles = [...articles];  
    const originalIndex = articles.findIndex((a) => a.title === article.title);  
    if (originalIndex !== -1) {  
      updatedArticles[originalIndex].isFavorite = !updatedArticles[originalIndex].isFavorite;  
      setArticles(updatedArticles);  
    }  
  };  

  const renderArticleCard = (article: Article, index: number) => (  
    <div   
      key={index}   
      className={`w-full ${gridView ? "h-70" : "h-auto"} rounded-lg shadow-md p-4 cursor-pointer transition duration-200 ${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-100"} mt-4`}>  
      <a  
        href={article.link || '#'}  
        target="_blank"  
        rel="noopener noreferrer"  
        className={`text-xl font-semibold mb-2 block ${isDarkMode ? "text-yellow-400" : "text-blue-800"} hover:text-blue-500 hover:underline transition-colors duration-200`}>  
        {gridView  
          ? (article.title.length > 30 ? article.title.substring(0, 30) + '...' : article.title)  
          : article.title}  
      </a>  
      <p className={`mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>  
        {article.info}  
      </p>  
      <p className={`mb-4 ${isDarkMode ? "text-gray-300" : "text-gray-900"}`}>  
        {gridView ? (article.description.substring(0, 80) + '...') : article.description}  
      </p>  
      <button  
        onClick={(e) => {  
          e.stopPropagation();  
          toggleFavorite(article);  
        }}  
        className={`text-white px-4 py-1 rounded transition duration-200 ${article.isFavorite ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}`}>  
        {article.isFavorite ? "已收藏" : "收藏"}  
      </button>  
    </div>  
  );  

  const latestUpdateDate = filteredArticles.length > 0 ?   
    filteredArticles.reduce((latest, article) => {  
      return new Date(article.createdAt) > new Date(latest) ? article.createdAt : latest;  
    }, filteredArticles[0].createdAt)   
    : "無資料";  

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
            <span className="ml-4">最近更新日期: {new Date(latestUpdateDate).toLocaleDateString("zh-TW")}</span>  
          </div>  
        </div>  

        <SearchField  
          placeholder="搜尋文章"  
          label="搜尋"  
          labelHidden  
          value={searchValue}  
          onChange={handleSearch}  
          hasSearchButton={false}  
          hasSearchIcon={true}  
          className="mb-6"  
        />  
        <div className={`mt-2 grid ${gridView ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "grid-cols-1"}`}>  
          {currentArticles.length > 0 ? (  
            currentArticles.map((article, index) => renderArticleCard(article, index))  
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