import React from 'react';  
import { News } from '@/dynamoDB/newsType';  
import { Heart } from 'lucide-react';  

interface NewsCardProps {  
  article: News;  
  index: number;  
  gridView: boolean;  
  isDarkMode: boolean;  
  toggleFavorite: (article: News) => void;  
}  

const NewsCard: React.FC<NewsCardProps> = ({  
  article,  
  index,  
  gridView,  
  isDarkMode,  
  toggleFavorite,  
}) => {  
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
          {article.title}  
        </a>  
      </h2>  
      <span className="text-sm text-gray-500 mb-1">{article.info}</span>  
      <p className="mt-2">{article.description}</p>  
      <div className="flex justify-between items-center mt-4">  
        <button  
          onClick={() => toggleFavorite(article)}  
          className={`px-3 py-2 text-sm rounded transition-colors duration-300 focus:outline-none ${  
            article.isFavorite ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'  
          }`}  
        >  
          {article.isFavorite ? '已收藏' : '收藏'}  
        </button>  
        <span className="text-sm text-gray-500">{article.createdAt}</span>  
      </div>  
    </div>  
  );  
};  

export default NewsCard;