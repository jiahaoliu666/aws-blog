// src/components/news/NewsSearch.tsx  
import React, { useState, useEffect } from 'react';  
import { SearchField } from '@aws-amplify/ui-react';  
import { News } from '@/types/newsType';  

interface BlogSearchProps {  
  articles: News[];  
  setFilteredArticles: React.Dispatch<React.SetStateAction<News[]>>;  
  isDarkMode: boolean;   
}  

const BlogSearch: React.FC<BlogSearchProps> = ({ articles, setFilteredArticles, isDarkMode }) => {  
  const [searchTerm, setSearchTerm] = useState('');  
  
  useEffect(() => {  
    // 設置防抖處理，延時300毫秒後執行過濾操作  
    const handler = setTimeout(() => {  
      const debouncedTerm = searchTerm.toLowerCase(); // 確保過濾時的一致性，將搜索詞轉為小寫  
      // 過濾出符合搜索詞的文章  
      const filtered = articles.filter((article) =>   
        article.title.toLowerCase().includes(debouncedTerm)  
      );  
      setFilteredArticles(filtered); // 更新過濾後的文章  
    }, 300); // 略長的防抖時間  
  
    // 清除防抖計時器以避免記憶體洩漏  
    return () => {  
      clearTimeout(handler);  
    };  
  }, [searchTerm, articles, setFilteredArticles]); // 確保這些依賴項正確反映狀態變化  

  return (  
    <div className="mb-4">  
      <SearchField  
        label="搜尋文章"  
        placeholder="搜尋文章"  
        hasSearchButton={false}  
        hasSearchIcon={true}  
        value={searchTerm}  
        onChange={(event) => setSearchTerm(event.target.value)}  // 當輸入變化時更新搜索詞  
        className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}  
        style={{ color: isDarkMode ? '#D1D5DB' : '#1F2937' }}  // 根據主題模式切換顏色  
      />  
    </div>  
  );  
};  

export default BlogSearch;