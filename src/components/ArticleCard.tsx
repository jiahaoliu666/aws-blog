// src/components/ArticleCard.tsx  
import React from 'react';  
import { News } from '../dynamoDB/newsType';  
import { Heart } from 'lucide-react';  

interface ArticleCardProps {  
  article: News;  
  index: number;  
  gridView: boolean;  
  isDarkMode: boolean;  
  toggleFavorite: (article: News) => void;  
}  

const ArticleCard: React.FC<ArticleCardProps> = ({  
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
      <h2 className="text-xl font-bold">{article.title}</h2>  
      <span className="text-sm text-gray-500">{article.info}</span> 
      <p className="mt-2">{article.description}</p>  
      <div className="flex justify-between items-center mt-4">  
        <span className="text-sm text-gray-500">{article.createdAt}</span>  
        <button  
          onClick={() => toggleFavorite(article)}  
          className="focus:outline-none"  
        >  
          <Heart  
            color={article.isFavorite ? "red" : "gray"}  
            size={24}  
          />  
        </button>  
      </div>  
    </div>  
  );  
};  

export default ArticleCard;