import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';  
import { SearchField } from '@aws-amplify/ui-react';  
import { ExtendedNews } from '@/types/newsType';
import { ExtendedArchitecture } from '@/types/architectureType';
import { FavoriteItem } from '@/types/favoriteTypes';

interface SearchProps<T> {
    articles: T[];
    setFilteredArticles: Dispatch<SetStateAction<T[]>>;
    isDarkMode: boolean;
    onSearch?: (term: string) => void;
}

export const Search = <T extends { 
  title?: string; 
  translated_title?: string; 
  article_title?: string;
  article?: {
    title?: string;
    translated_title?: string;
  };
  description?: string;
  translated_description?: string;
  itemType?: string;
}>({ 
  articles, 
  setFilteredArticles, 
  isDarkMode,
  onSearch 
}: SearchProps<T>) => {  
  const [searchTerm, setSearchTerm] = useState('');  
  
  useEffect(() => {  
    const handler = setTimeout(() => {  
      const debouncedTerm = searchTerm.toLowerCase().trim();  
      onSearch?.(debouncedTerm);
      
      if (!debouncedTerm) {
        setFilteredArticles(articles);
        return;
      }
      
      const filtered = articles.filter((article) => {
        const mainTitle = article.title || 
                        article.article_title || 
                        article.article?.title || '';
        const translatedTitle = article.translated_title || 
                              article.article?.translated_title || '';
        const description = article.description || '';
        const translatedDescription = article.translated_description || '';
        
        const searchableText = [
          mainTitle,
          translatedTitle,
          description,
          translatedDescription
        ].map(text => (text || '').toLowerCase());
        
        return searchableText.some(text => text.includes(debouncedTerm));
      });  

      setFilteredArticles(filtered);  
    }, 300);  

    return () => clearTimeout(handler);  
  }, [searchTerm, articles, setFilteredArticles, onSearch]);  

  const handleClear = () => {
    setSearchTerm('');
    setFilteredArticles(articles);
    onSearch?.('');
  };

  return (  
    <div className="mb-4">  
      <SearchField  
        label="搜尋文章"  
        placeholder="輸入標題或描述"  
        hasSearchButton={false}  
        hasSearchIcon={true}  
        value={searchTerm}  
        onChange={(event) => setSearchTerm(event.target.value)}  
        onClear={handleClear}  
        className={`w-full amplify-searchfield ${isDarkMode ? 'dark' : ''}`}
        labelHidden={true}
      />  
    </div>  
  );  
};  

export default Search;