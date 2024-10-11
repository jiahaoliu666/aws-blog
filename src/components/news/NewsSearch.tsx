import React, { useState, useEffect } from 'react';  
import { SearchField } from '@aws-amplify/ui-react';  
import { News } from '@/dynamoDB/newsType';  

interface BlogSearchProps {  
  articles: News[];  
  setFilteredArticles: React.Dispatch<React.SetStateAction<News[]>>;  
  isDarkMode: boolean;   
}  

const BlogSearch: React.FC<BlogSearchProps> = ({ articles, setFilteredArticles, isDarkMode }) => {  
  const [searchTerm, setSearchTerm] = useState('');  
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);  

  useEffect(() => {  
    const handler = setTimeout(() => {  
      setDebouncedSearchTerm(searchTerm);  
    }, 200); // 200毫秒防抖

    return () => {  
      clearTimeout(handler);  
    };  
  }, [searchTerm]);  

  useEffect(() => {  
    const filtered = articles.filter((article) =>   
      article.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase())  
    );  
    setFilteredArticles(filtered);  
  }, [debouncedSearchTerm, articles, setFilteredArticles]);  

  return (  
    <div className="mb-4">  
      <SearchField  
        label="搜尋文章"  
        placeholder="搜尋文章"  
        hasSearchButton={false}  
        hasSearchIcon={true}  
        value={searchTerm}  
        onChange={(event) => setSearchTerm(event.target.value)}  
        className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}  
        style={{ color: isDarkMode ? '#D1D5DB' : '#1F2937' }}  
      />  
    </div>  
  );  
};  

export default BlogSearch;  
