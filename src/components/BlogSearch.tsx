// src/components/BlogSearch.tsx  
import React, { useState } from 'react';  
import { News } from '../dynamoDB/newsTpye';   

interface BlogSearchProps {  
  articles: News[];  
  setFilteredArticles: React.Dispatch<React.SetStateAction<News[]>>;  
  isDarkMode: boolean;   
}  

const BlogSearch: React.FC<BlogSearchProps> = ({ articles, setFilteredArticles, isDarkMode }) => {  
  const [searchTerm, setSearchTerm] = useState('');  

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {  
    const term = event.target.value;  
    setSearchTerm(term);  
    const filtered = articles.filter((article) =>   
      article.title.includes(term) // 使用 title 進行搜尋  
    );  
    setFilteredArticles(filtered);  
  };  

  return (  
    <div className="mb-4">  
      <input   
        type="text"  
        placeholder="搜尋文章..."  
        value={searchTerm}  
        onChange={handleSearch}  
        className={`border rounded p-2 w-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-900'}`}  
      />  
    </div>  
  );  
};  

export default BlogSearch;