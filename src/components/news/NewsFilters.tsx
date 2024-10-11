import React from 'react';  
import { SwitchField } from "@aws-amplify/ui-react";  
import { News } from '@/dynamoDB/newsType';  

interface NewsFiltersProps {  
  gridView: boolean;  
  isDarkMode: boolean;  
  showFavorites: boolean;  
  setGridView: (value: boolean) => void;  
  setIsDarkMode: (value: boolean) => void;  
  setShowFavorites: (value: boolean) => void;  
  startDate: string;  
  endDate: string;  
  setStartDate: (value: string) => void;  
  setEndDate: (value: string) => void;  
  sortOrder: "newest" | "oldest";  
  setSortOrder: (value: "newest" | "oldest") => void;  
  onDateFilterChange: (startDate: string, endDate: string) => void;  
  filteredArticles: News[];  
  filteredFavoritesCount: number;  
  language: string;  
  setLanguage: (value: string) => void;  
}  

const NewsFilters: React.FC<NewsFiltersProps> = ({  
  gridView,  
  isDarkMode,  
  showFavorites,  
  setGridView,  
  setIsDarkMode,  
  setShowFavorites,  
  startDate,  
  endDate,  
  setStartDate,  
  setEndDate,  
  sortOrder,  
  setSortOrder,  
  onDateFilterChange,  
  filteredArticles,  
  filteredFavoritesCount,  
  language,  
  setLanguage  
}) => {  
  return (  
    <div className="mb-4 flex flex-col md:flex-row justify-between p-4">  
      {/* 第一列：切換視圖、主題、檢視收藏 */}  
      <div className="flex flex-wrap items-center space-x-4 mb-4 md:mb-0">  
        <SwitchField  
          isDisabled={false}  
          label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>切換視圖</span>}  
          labelPosition="start"  
          isChecked={gridView}  
          onChange={(e) => setGridView(e.target.checked)}  
        />  
        <SwitchField  
          isDisabled={false}  
          label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>切換主題</span>}  
          labelPosition="start"  
          isChecked={isDarkMode}  
          onChange={(e) => setIsDarkMode(e.target.checked)}  
        />  
        <SwitchField  
          isDisabled={false}  
          label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>檢視收藏</span>}  
          labelPosition="start"  
          isChecked={showFavorites}  
          onChange={(e) => setShowFavorites(e.target.checked)}  
        />  
      </div>  

      {/* 第二列：篩選日期範圍、排序方式、語言切換、文章數量 */}  
      <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">  
        <div className="flex items-center">  
          <label className={`${isDarkMode ? "text-gray-300" : "text-gray-700"} mr-2`}>篩選日期範圍:</label>  
          <input   
            type="date"   
            value={startDate}   
            onChange={(e) => {  
              setStartDate(e.target.value);  
              onDateFilterChange(e.target.value, endDate);  
            }}   
            className={`${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"} border border-gray-300 rounded-md p-2 md:w-40`}  
          />  
          <span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"} mx-2`}>至</span>  
          <input   
            type="date"   
            value={endDate}   
            onChange={(e) => {  
              setEndDate(e.target.value);  
              onDateFilterChange(startDate, e.target.value);  
            }}   
            className={`${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"} border border-gray-300 rounded-md p-2 md:w-40`}  
          />  
        </div>  
        <label className={`${isDarkMode ? "text-gray-300" : "text-gray-700"} ml-0 md:ml-4 mr-2`}>排序方式:</label>  
        <select   
          value={sortOrder}   
          onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}   
          className={`${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"} border border-gray-300 rounded-md p-2 md:w-32`}  
        >  
          <option value="newest">最新文章</option>  
          <option value="oldest">最舊文章</option>  
        </select>  

        {/* 語言切換 */}  
        <label className={`${isDarkMode ? "text-gray-300" : "text-gray-700"} ml-0 md:ml-4 mr-2`}>文章語言:</label>  
        <select   
          value={language}   
          onChange={(e) => setLanguage(e.target.value)}   
          className={`${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"} border border-gray-300 rounded-md p-2 md:w-32`}  
        >  
          <option value="zh-TW">繁體中文</option>  
          <option value="en">English</option>  
        </select>  

        {/* 文章數量 */}  
        <div className={`${isDarkMode ? "text-gray-300" : "text-gray-700"} ml-0 md:ml-4`}>  
          文章數量: {showFavorites ? filteredFavoritesCount : (filteredArticles?.length || 0)}  
        </div>  
      </div>  
    </div>  
  );  
};  

export default NewsFilters;