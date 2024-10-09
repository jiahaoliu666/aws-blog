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
  onDateFilterChange: (startDate: string, endDate: string) => void; // 更新的屬性  
  filteredArticles: News[]; // 新增的屬性  
  filteredFavoritesCount: number; // 新增的屬性  
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
  onDateFilterChange, // 更新的屬性  
  filteredArticles, // 新增的屬性  
  filteredFavoritesCount // 新增的屬性  
}) => {  
  return (  
    <div className="mb-4 flex flex-wrap justify-between">  
      {/* 第一列：切換視圖、主題、檢視收藏 */}  
      <div className="flex items-center space-x-6">  
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

      {/* 第二列：篩選日期範圍、排序方式、文章數量 */}  
      <div className="flex items-center space-x-* ml-auto ">  
        <div className="flex items-center">  
          <label className={`${isDarkMode ? "text-gray-300" : "text-gray-700"} mr-2`}>篩選日期範圍:</label>  
          <input   
            type="date"   
            value={startDate}   
            onChange={(e) => {  
              setStartDate(e.target.value);  
              onDateFilterChange(e.target.value, endDate); // 調用篩選函數  
            }}   
            className={`${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"} border border-gray-300 rounded-md p-2`}  
          />  
          <span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"} mx-2`}>至</span>  
          <input   
            type="date"   
            value={endDate}   
            onChange={(e) => {  
              setEndDate(e.target.value);  
              onDateFilterChange(startDate, e.target.value); // 調用篩選函數  
            }}   
            className={`${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"} border border-gray-300 rounded-md p-2`}  
          />  
        </div>  
        <label className={`${isDarkMode ? "text-gray-300" : "text-gray-700"} ml-4 mr-2`}>排序方式:</label>  
        <select   
          value={sortOrder}   
          onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}   
          className={`${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"} border border-gray-300 rounded-md p-2`}  
        >  
          <option value="newest">最新文章</option>  
          <option value="oldest">最舊文章</option>  
        </select>  

        {/* 文章數量 */}  
        <div className={`${isDarkMode ? "text-gray-300" : "text-gray-700"} ml-4`}>  
          文章數量: {showFavorites ? filteredFavoritesCount : (filteredArticles?.length || 0)}  
        </div>  
      </div>  
    </div>  
  );  
};  

export default NewsFilters;
