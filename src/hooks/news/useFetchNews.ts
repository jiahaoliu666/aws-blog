import { useEffect, useState } from 'react';  
import { News, ExtendedNews } from '@/types/newsType';  

const useFetchNews = (language: string): ExtendedNews[] => {  
  const [articles, setArticles] = useState<ExtendedNews[]>([]);  

  useEffect(() => {  
    const fetchArticles = async () => {  
      const response = await fetch(`/api/news?language=${language}`);  
      const data: News[] = await response.json();  

      const initializedArticles: ExtendedNews[] = data.map(article => ({  
        ...article,  
        isFavorite: article.isFavorite ?? false,  // 確保 isFavorite 被初始化  
      }));  

      setArticles(initializedArticles);  
    };  

    fetchArticles();  
  }, [language]);  

  return articles;  
};  

export default useFetchNews;
