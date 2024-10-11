// src/hooks/news/useFetchNews.ts  
import { useEffect, useState } from 'react';  
import { News } from '@/types/newsType';  

// 自定義 Hook，用於從 API 獲取新聞  
const useFetchNews = (language: string) => {  
  const [articles, setArticles] = useState<News[]>([]);  

  useEffect(() => {  
    // 定義異步函數以獲取文章  
    const fetchArticles = async () => {  
      const response = await fetch(`/api/news?language=${language}`);  // 向 API 發送請求  
      const data: News[] = await response.json();  // 解析回應為 JSON  

      // 初始化文章，確保每個文章都有 isFavorite 屬性  
      const initializedArticles = data.map(article => ({  
        ...article,  
        isFavorite: article.isFavorite ?? false,  
      }));  

      setArticles(initializedArticles);  // 更新狀態  
    };  

    fetchArticles();  // 執行文章獲取函數  
  }, [language]);  // 當語言變更時重新獲取文章  

  return articles;  
};  

export default useFetchNews;  