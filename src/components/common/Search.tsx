import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';  
import { SearchField } from '@aws-amplify/ui-react';  
import { ExtendedNews } from '@/types/newsType';  

interface SearchProps<T extends { title: string }> {  
  articles: T[];  
  setFilteredArticles: Dispatch<SetStateAction<T[]>>;  
  isDarkMode: boolean;   
}  

export const Search = <T extends { title: string }>({ articles, setFilteredArticles, isDarkMode }: SearchProps<T>) => {  
  const [searchTerm, setSearchTerm] = useState('');  
  
  useEffect(() => {  
    const handler = setTimeout(() => {  
      const debouncedTerm = searchTerm.toLowerCase();  
      const filtered = articles.filter((article) =>   
        article.title.toLowerCase().includes(debouncedTerm)  
      );  
      setFilteredArticles(filtered);  
    }, 300);  
  
    return () => {  
      clearTimeout(handler);  
    };  
  }, [searchTerm, articles, setFilteredArticles]);  

  return (  
    <div className="mb-4">  
      <SearchField  
        label="搜尋文章"  
        placeholder="搜尋文章"  
        hasSearchButton={false}  
        hasSearchIcon={true}  
        value={searchTerm}  
        onChange={(event) => setSearchTerm(event.target.value)}  
        className={`w-full amplify-searchfield ${isDarkMode ? 'dark' : ''}`}
        labelHidden={true}
      />  
    </div>  
  );  
};  

export default Search;