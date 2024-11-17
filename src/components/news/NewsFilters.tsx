// src/components/news/NewsFilters.tsx
import React from 'react';  
import { SwitchField } from "@aws-amplify/ui-react";  
import { News } from '@/types/newsType';  
import { useProfilePreferences } from '@/hooks/profile/useProfilePreferences';
import { useAuthContext } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { PreferenceSettings } from '@/types/profileTypes';

interface NewsFiltersProps {  
  gridView: boolean;  
  showFavorites: boolean;  
  setShowFavorites: (value: boolean) => void;  
  setGridView: (value: boolean) => void;  
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
  showFavorites,  
  setShowFavorites,  
  setGridView,  
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
  const { isDarkMode, toggleDarkMode } = useTheme();

  const handlePreferenceChange = (key: keyof PreferenceSettings, value: PreferenceSettings[keyof PreferenceSettings]) => {
    if (user?.id) {
      updatePreferences({ ...preferences, [key]: value, userId: user.id });
    }
  };

  const handleSummariesToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowSummaries(e.target.checked);
    handlePreferenceChange('autoSummarize', e.target.checked);
  };

  const handleDarkModeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    toggleDarkMode();
  };

  const handleViewModeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGridView(e.target.checked);
    handlePreferenceChange('viewMode', e.target.checked ? 'grid' : 'list');
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    handlePreferenceChange('language', value);
  };

  return (
    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
      <div className="flex items-center space-x-4">

        <SwitchField
          isDisabled={false}
          label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>一鍵總結</span>}
          labelPosition="start"
          isChecked={showSummaries}
          onChange={handleSummariesToggle}
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
          onChange={handleDarkModeToggle}
        />
        <SwitchField
          isDisabled={false}
          label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>切換視圖</span>}
          labelPosition="start"
          isChecked={gridView}
          onChange={handleViewModeToggle}
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
