// src/components/news/NewsCard.tsx  
import React, { useState, useEffect } from 'react';  
import { News } from '@/types/newsType';  

// 定義 NewsCard 組件的屬性類型  
interface NewsCardProps {  
  article: News;  // 文章對象  
  index: number;  // 文章索引  
  gridView: boolean;  // 是否使用網格視圖  
  isDarkMode: boolean;  // 是否啟用深色模式  
  toggleFavorite: (article: News) => void;  // 切換收藏狀態的函數  
  language: string;  // 語言設置  
  showSummaries: boolean;  // 是否顯示摘要  
}  

const NewsCard: React.FC<NewsCardProps> = ({  
  article,  
  index,  
  gridView,  
  isDarkMode,  
  toggleFavorite,  
  language,  
  showSummaries,  
}) => {  
  const [isSummaryVisible, setIsSummaryVisible] = useState<boolean>(false);  

  // 當語言或是否顯示摘要的狀態改變時，更新摘要的可見性  
  useEffect(() => {  
    setIsSummaryVisible(showSummaries);  
  }, [language, showSummaries]);  

  // 處理摘要顯示狀態的切換  
  const handleSummaryClick = () => {  
    setIsSummaryVisible(!isSummaryVisible);  
  };  

  return (  
    <div  
      className={`border rounded-lg p-4 transition-shadow duration-300 ${  
        isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-900'  // 根據主題變更背景色和文字顏色  
      } ${gridView ? 'shadow-md hover:shadow-lg' : 'mb-4'}`}  // 依據視圖模式調整陰影樣式  
    >  
      <h2 className="text-xl font-bold mb-2">  
        <a  
          href={article.link}  // 文章的連結  
          target="_blank"  
          rel="noopener noreferrer"  
          className="hover:underline hover:text-blue-500 transition-colors duration-300"  
        >  
          {/* 顯示文章標題，根據語言選擇翻譯後標題或原標題 */}  
          {language === 'zh-TW' ? article.translated_title || article.title : article.title}  
        </a>  
      </h2>  
      <span className="text-sm text-gray-500 mb-1">{article.info}</span>  
      <p className="mt-2">{language === 'zh-TW' ? article.translated_description || article.description : article.description}</p>    
      <div className="flex justify-between items-center mt-4">  
        <div className="flex">  
          <button  
            onClick={() => toggleFavorite(article)}  // 切換收藏狀態  
            className={`px-3 py-2 text-sm rounded transition-colors duration-300 focus:outline-none ${  
              article.isFavorite ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'  // 根據收藏狀態改變按鈕樣式  
            }`}  
          >  
            {article.isFavorite ? '已收藏' : '收藏'} 
          </button>  
          <button  
            onClick={handleSummaryClick}  // 點擊顯示或隱藏摘要  
            className="mx-2 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-300"  
          >  
            {isSummaryVisible ? '隱藏總結' : '顯示總結'}    
          </button>  
        </div>  
        <span className="text-sm text-gray-500">{article.createdAt}</span> 
      </div>  
      {isSummaryVisible && article.summary && (  // 如果摘要可見且存在摘要，顯示摘要內容  
        <div className={`mt-4 p-2 border rounded ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-900'}`}>  
          <h3 className="font-bold">內容總結：</h3>  
          <p>{article.summary}</p>   
        </div>  
      )}  
    </div>  
  );  
};  

export default NewsCard;