// src/components/news/NewsFilters.tsx
import React from 'react';  
import { SwitchField } from "@aws-amplify/ui-react";  
import { News } from '@/types/newsType';  
import { useProfilePreferences } from '@/hooks/profile/useProfilePreferences';
import { useAuthContext } from '@/context/AuthContext';

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
  showSummaries,  
  setShowSummaries  
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { preferences, updatePreferences } = useProfilePreferences();
  const { user } = useAuthContext();

  // 處理偏好設定的變更並同時更新到 AWS
  const handlePreferenceChange = async (key: string, value: any) => {
    if (!user?.id) return;

    // 更新到 AWS
    try {
      await updatePreferences({
        ...preferences,
        userId: user.id,
        [key]: value
      });
    } catch (error) {
      console.error('更新偏好設定失敗:', error);
    }
  };

  // 修改切換按鈕的處理函數
  const handleDarkModeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    handlePreferenceChange('theme', checked ? 'dark' : 'light');
  };

  // 修改視圖切換邏輯
  const handleViewModeToggle = (checked: boolean) => {
    setGridView(checked);
    handlePreferenceChange('viewMode', checked ? 'grid' : 'list');
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    handlePreferenceChange('language', value);
  };

  const handleSummariesToggle = (checked: boolean) => {
    setShowSummaries(checked);
    handlePreferenceChange('autoSummarize', checked);
  };

  // 初始化時從 preferences 載入設定
  React.useEffect(() => {
    if (preferences) {
      setIsDarkMode(preferences.theme === 'dark');
      setGridView(preferences.viewMode === 'list');
      setLanguage(preferences.language);
      setShowSummaries(preferences.autoSummarize);
    }
  }, [preferences]);

  return (
    <div className="mb-4 p-4 max-w-full">
      <div className="flex justify-start items-center lg:hidden">
        <button
          className="p-2 border rounded transform transition duration-300 hover:scale-105"
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

      <div className={`flex flex-col lg:flex-row lg:flex-wrap items-center gap-4 max-w-full ${isMenuOpen ? 'block' : 'hidden'} lg:flex`}>
        <SwitchField
          isDisabled={false}
          label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>一鍵總結</span>}
          labelPosition="start"
          isChecked={showSummaries}
          onChange={(e) => handleSummariesToggle(e.target.checked)}
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
          onChange={(e) => handleDarkModeToggle(e.target.checked)}
        />
        <SwitchField
          isDisabled={false}
          label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>切換視圖</span>}
          labelPosition="start"
          isChecked={gridView}
          onChange={(e) => handleViewModeToggle(e.target.checked)}
        />
        <div className="flex flex-col md:flex-row items-center gap-2 ">
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
        <div className="flex flex-col md:flex-row items-center gap-2">
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
        <div className="flex flex-col md:flex-row items-center gap-2">
          <label className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>語言：</label>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
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
  );
};

export default NewsFilters;
