// src/components/news/NewsFilters.tsx
import React from 'react';  
import { SwitchField } from "@aws-amplify/ui-react";  
import { News } from '@/types/newsType';  

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
  toggleShowSummaries: () => void;  
  showSummaries: boolean;  
  setShowSummaries: (value: boolean) => void; 
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
  showSummaries,  
  setShowSummaries  
}) => {  
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (  
    <div className="mb-4 p-4 max-w-full">  
      <div className="flex justify-start items-center">
        <button
          className="lg:hidden p-2 border rounded transform transition duration-300 hover:scale-105"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 5.25h16.5m-16.5 6.75h16.5m-16.5 6.75h16.5"
            />
          </svg>
        </button>
      </div>

      <div className={`flex flex-col gap-4 lg:flex-row justify-start ${isMenuOpen ? 'block' : 'hidden'} lg:flex flex-wrap`}>
        <div className="flex flex-col md:flex-wrap md:flex-row items-center gap-4 max-w-full">
          <SwitchField  
            isDisabled={false}  
            label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>一鍵總結</span>}  
            labelPosition="start"  
            isChecked={showSummaries}  
            onChange={toggleShowSummaries}  
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
          {/* 在大屏幕上始終顯示切換視圖的功能 */}
          <div className="hidden lg:block">
            <SwitchField  
              isDisabled={false}  
              label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>切換視圖</span>}  
              labelPosition="start"  
              isChecked={gridView}  
              onChange={(e) => setGridView(e.target.checked)}  
            />
          </div>
        </div>  

        {/* 在小屏幕且非菜單欄模式下顯示切換視圖的功能 */}
        {!isMenuOpen && (
          <div className="flex flex-col md:flex-wrap md:flex-row items-center gap-4 max-w-full lg:hidden">
            <SwitchField  
              isDisabled={false}  
              label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>切換視圖</span>}  
              labelPosition="start"  
              isChecked={gridView}  
              onChange={(e) => setGridView(e.target.checked)}  
            />
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center gap-4 ml-auto max-w-full">
          <div className="flex items-center gap-2">
            <label className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>日期：</label>
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
            <label className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>排序：</label>
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
            <label className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>語言：</label>
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
            文章數量：{showFavorites ? filteredFavoritesCount : (filteredArticles?.length || 0)}  
          </div>  
        </div>  
      </div>  
    </div>  
  );  
};  

export default NewsFilters;
