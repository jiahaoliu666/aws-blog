import { useEffect, useState } from 'react';  
import { News } from '../dynamoDB/newsType';  

const useFetchNews = () => {  
  const [articles, setArticles] = useState<News[]>([]);  

  useEffect(() => {  
    const fetchArticles = async () => {  
      // 假設這裡是從 API 獲取文章的邏輯  
      const response = await fetch('/api/news');  
      const data: News[] = await response.json();  

      // 確保每篇文章都有 isFavorite 屬性  
      const initializedArticles = data.map(article => ({  
        ...article,  
        isFavorite: article.isFavorite ?? false, // 如果沒有 isFavorite，則設置為 false  
      }));  

      setArticles(initializedArticles);  
    };  

    fetchArticles();  
  }, []);  

  return articles;  
};  

export default useFetchNews;