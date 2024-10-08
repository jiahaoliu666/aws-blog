import { useEffect, useState } from 'react';  
import { News } from '@/dynamoDB/newsType';  

const useFetchNews = () => {  
  const [articles, setArticles] = useState<News[]>([]);  

  useEffect(() => {  
    const fetchArticles = async () => {  
      try {  
        const response = await fetch('/api/news'); // 使用 Next.js API 路由  
        if (!response.ok) throw new Error('Network response was not ok');  
        const data = await response.json();  

        const articlesWithDefaults: News[] = data.map((article: any) => ({  
          title: article.title,  
          description: article.description,  
          info: article.info || '',  
          isFavorite: false,  
          author: article.author || '未知',  
          link: article.link || '#',  
        }));  

        setArticles(articlesWithDefaults);  
      } catch (error) {  
        console.error('獲取文章時發生錯誤:', error);  
      }  
    };  

    fetchArticles();  
  }, []);  

  return articles;  
};  

export default useFetchNews;