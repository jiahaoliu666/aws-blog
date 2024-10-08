// src/components/BlogSearch.tsx  
import React, { useState } from 'react';  

interface Article {  
  title: string;  
  content: string;  
  tags?: string[];  
  isFavorite: boolean;  
  createdAt: string;  
}  

interface BlogSearchProps {  
  articles: Article[];  
  setFilteredArticles: React.Dispatch<React.SetStateAction<Article[]>>;  
  isDarkMode: boolean;   
}  

const BlogSearch: React.FC<BlogSearchProps> = ({ articles, setFilteredArticles, isDarkMode }) => {  
  const [searchTerm, setSearchTerm] = useState('');  

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {  
    const term = event.target.value;  
    setSearchTerm(term);  
    const filtered = articles.filter((article) =>   
      article.title.includes(term) || article.content.includes(term)  
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
        className={`border rounded p-2 w-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-900'}`} // 適應深色模式  
      />  
    </div>  
  );  
};  

export default BlogSearch;