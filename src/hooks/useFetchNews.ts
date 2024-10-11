
import { useEffect, useState } from 'react';  
import { News } from '../dynamoDB/newsType';  

const useFetchNews = (language: string) => {  
  const [articles, setArticles] = useState<News[]>([]);  

  useEffect(() => {  
    const fetchArticles = async () => {  
      const response = await fetch(`/api/news?language=${language}`);  
      const data: News[] = await response.json();  

      const initializedArticles = data.map(article => ({  
        ...article,  
        isFavorite: article.isFavorite ?? false,  
      }));  

      setArticles(initializedArticles);  
    };  

    fetchArticles();  
  }, [language]);  

  return articles;  
};  

export default useFetchNews;