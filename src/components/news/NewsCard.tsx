// src/components/news/NewsCard.tsx  

import React, { useState, useEffect } from 'react';  
import { News } from '@/dynamoDB/newsType';  

interface NewsCardProps {  
  article: News;  
  index: number;  
  gridView: boolean;  
  isDarkMode: boolean;  
  toggleFavorite: (article: News) => void;  
  language: string;  
}  

const NewsCard: React.FC<NewsCardProps> = ({  
  article,  
  index,  
  gridView,  
  isDarkMode,  
  toggleFavorite,  
  language,  
}) => {  
  const [isSummaryVisible, setIsSummaryVisible] = useState<boolean>(false);  

  // 使用 useEffect 監聽語言變化  
  useEffect(() => {  
    // 當語言變化時，關閉摘要  
    setIsSummaryVisible(false);  
  }, [language]);  

  const handleSummaryClick = () => {  
    if (article.summary) {  
      setIsSummaryVisible(true);  
    } else {  
      console.warn("摘要未找到");  
      alert("摘要不可用");  
    }  
  };  

  const handleCloseSummary = () => {  
    setIsSummaryVisible(false);  
  };  

  return (  
    <div  
      className={`border rounded-lg p-4 transition-shadow duration-300 ${  
        isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-900'  
      } ${gridView ? 'shadow-md hover:shadow-lg' : 'mb-4'}`}  
    >  
      <h2 className="text-xl font-bold mb-2">  
        <a  
          href={article.link}  
          target="_blank"  
          rel="noopener noreferrer"  
          className="hover:underline hover:text-blue-500 transition-colors duration-300"  
        >  
          {language === 'zh-TW' ? article.translated_title || article.title : article.title}  
        </a>  
      </h2>  
      <span className="text-sm text-gray-500 mb-1">{article.info}</span>  
      <p className="mt-2">{language === 'zh-TW' ? article.translated_description || article.description : article.description}</p>  
      <div className="flex justify-between items-center mt-4">  
        <div className="flex">  
          <button  
            onClick={() => toggleFavorite(article)}  
            className={`px-3 py-2 text-sm rounded transition-colors duration-300 focus:outline-none ${  
              article.isFavorite ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'  
            }`}  
          >  
            {article.isFavorite ? '已收藏' : '收藏'}  
          </button>  
          <button  
            onClick={handleSummaryClick}  
            className="mx-2 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-300"  
          >  
            總結  
          </button>  
        </div>  
        <span className="text-sm text-gray-500">{article.createdAt}</span>  
      </div>  
      {isSummaryVisible && article.summary && (  
        <div className="mt-4 p-2 border rounded bg-gray-100">  
          <h3 className="font-bold">內容總結：</h3>  
          <p>{article.summary}</p>  
          <button  
            onClick={handleCloseSummary}  
            className="mt-2 text-sm text-red-500 hover:underline"  
          >  
            關閉  
          </button>  
        </div>  
      )}  
    </div>  
  );  
};  

export default NewsCard;