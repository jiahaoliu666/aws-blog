
// // src/components/news/NewsFilters.tsx  
import React, { useEffect } from 'react';  // 確保引入 useEffect  
import { SwitchField } from "@aws-amplify/ui-react";  
import { News } from '@/types/newsType';  

// 定義 NewsFilters 組件的屬性類型  
interface NewsFiltersProps {  
  gridView: boolean;  // 是否使用網格視圖  
  isDarkMode: boolean;  // 是否啟用深色模式  
  showFavorites: boolean;  // 是否顯示收藏的文章  
  setGridView: (value: boolean) => void;  // 設置網格視圖的函數  
  setIsDarkMode: (value: boolean) => void;  // 設置深色模式的函數  
  setShowFavorites: (value: boolean) => void;  // 設定顯示收藏文章的函數  
  startDate: string;  // 篩選的開始日期  
  endDate: string;  // 篩選的結束日期  
  setStartDate: (value: string) => void;  // 設置開始日期的函數  
  setEndDate: (value: string) => void;  // 設置結束日期的函數  
  sortOrder: "newest" | "oldest";  // 排序順序  
  setSortOrder: (value: "newest" | "oldest") => void;  // 設置排序順序的函數  
  onDateFilterChange: (startDate: string, endDate: string) => void;  // 處理日期篩選變更的函數  
  filteredArticles: News[];  // 篩選後的文章列表  
  filteredFavoritesCount: number;  // 篩選後收藏的文章數量  
  language: string;  // 語言設置  
  setLanguage: (value: string) => void;  // 設置語言的函數  
  toggleShowSummaries: () => void;  // 切換顯示摘要的函數  
  showSummaries: boolean;  // 是否顯示摘要  
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
  setLanguage,  
  toggleShowSummaries,  
  showSummaries  
}) => {  

  // Log 出已收藏的文章數量  
  useEffect(() => {  
    console.log(`Filtered Articles Count: ${filteredArticles.length}, Favorite Articles Count: ${filteredFavoritesCount}`);  
  }, [filteredArticles, filteredFavoritesCount]);  

  return (  
    <div className="mb-4 p-4">  
      <div className="flex flex-col gap-4 md:flex-row justify-between">  
        <div className="flex flex-col md:flex-wrap md:flex-row items-center gap-4">  
          <SwitchField  
            isDisabled={false}  
            label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>一鍵總結</span>}  
            labelPosition="start"  
            isChecked={showSummaries}  
            onChange={() => toggleShowSummaries()}  
          />  
          <SwitchField  
            isDisabled={false}  
            label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>檢視收藏</span>}  
            labelPosition="start"  
            isChecked={showFavorites}  
            onChange={(e) => setShowFavorites(e.target.checked)}  
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
            label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>切換視圖</span>}  
            labelPosition="start"  
            isChecked={gridView}  
            onChange={(e) => setGridView(e.target.checked)}  
          />  
        </div>  

        <div className="flex flex-col md:flex-row items-center gap-4">  
          <div className="flex items-center gap-2">  
            <label className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>日期:</label>  
            <input  
              type="date"  
              value={startDate}  
              onChange={(e) => {  
                setStartDate(e.target.value);  
                onDateFilterChange(e.target.value, endDate);  
              }}  
              className={`${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"} border border-gray-300 rounded-md p-2 md:w-40`}  
            />  
            <span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>至</span>  
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
          <div className="flex items-center gap-2">  
            <label className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>排序:</label>  
            <select  
              value={sortOrder}  
              onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}  
              className={`${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"} border border-gray-300 rounded-md p-2 md:w-32`}  
            >  
              <option value="newest">最新文章</option>  
              <option value="oldest">最舊文章</option>  
            </select>  
          </div>  

          <div className="flex items-center gap-2">  
            <label className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>語言:</label>  
            <select  
              value={language}  
              onChange={(e) => setLanguage(e.target.value)}  
              className={`${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"} border border-gray-300 rounded-md p-2 md:w-32`}  
            >  
              <option value="zh-TW">繁體中文</option>  
              <option value="en">English</option>  
            </select>  
          </div>  

          <div className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>  
            文章數量: {showFavorites ? filteredFavoritesCount : (filteredArticles?.length || 0)}  
          </div>  
        </div>  
      </div>  
    </div>  
  );  
};  

export default NewsFilters;



