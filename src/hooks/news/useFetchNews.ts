import { useEffect, useState } from 'react';  
import { News, ExtendedNews } from '@/types/newsType';  
import { browserStorage } from '@/utils/browserStorage';

const CACHE_KEY = 'news';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分鐘

const useFetchNews = (language: string): ExtendedNews[] => {  
  const [articles, setArticles] = useState<ExtendedNews[]>([]);  

  useEffect(() => {  
    const fetchArticles = async () => {  
      try {
        // 檢查本地緩存
        const cachedData = browserStorage.getItem(CACHE_KEY);
        const cachedTime = browserStorage.getItem(`${CACHE_KEY}_time`);
        const now = Date.now();

        // 如果有緩存且未過期，使用緩存數據
        if (cachedData && cachedTime && (now - Number(cachedTime)) < CACHE_EXPIRY) {
            const parsedData = JSON.parse(cachedData);
            if (parsedData.language === language) {
                setArticles(parsedData.data);
                return;
            }
        }

        const timestamp = new Date().getTime();
        const response = await fetch(`/api/news?language=${language}&t=${timestamp}`);  
        const data = await response.json();  

        if (!data.items || !Array.isArray(data.items)) {
          console.error('無效的數據格式:', data);
          setArticles([]);
          return;
        }

        const initializedArticles: ExtendedNews[] = data.items.map((article: News) => ({  
          article_id: article.article_id,
          title: article.title,
          info: article.info || '',
          description: article.description || '',
          link: article.link,
          summary: article.summary || '',
          translated_title: article.translated_title || '',
          translated_description: article.translated_description || '',
          created_at: article.created_at,
          isFavorite: false
        }));  

        // 按照 created_at 降序排序
        initializedArticles.sort((a, b) => {
          const dateA = new Date(Number(a.created_at) * 1000);
          const dateB = new Date(Number(b.created_at) * 1000);
          return dateB.getTime() - dateA.getTime();
        });

        setArticles(initializedArticles);  

        // 更新本地緩存
        browserStorage.setItem(CACHE_KEY, JSON.stringify({
            language,
            data: initializedArticles
        }));
        browserStorage.setItem(`${CACHE_KEY}_time`, String(now));
      } catch (error) {
        console.error('獲取新聞文章時發生錯誤:', error);
        setArticles([]);
      }
    };  

    fetchArticles();  
  }, [language]);  

  return articles;  
};  

export default useFetchNews;
