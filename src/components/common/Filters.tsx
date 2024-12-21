import React, { useEffect, useState } from 'react';  
import { SwitchField } from "@aws-amplify/ui-react";  
import { News } from '@/types/newsType';  
import { useProfilePreferences } from '@/hooks/profile/useProfilePreferences';
import { useAuthContext } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { PreferenceSettings } from '@/types/profileTypes';

interface FiltersProps {  
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

const DEFAULT_PREFERENCES = {
  showSummaries: false,  // 一鍵總結預設關閉
  gridView: false,       // 預設列表視圖
  theme: 'light',        // 預設亮色主題
  language: 'zh-TW'      // 預設繁體中文
};

const Filters: React.FC<FiltersProps> = ({  
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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const savedSummary = localStorage.getItem('newsSummaryPreference');
      const savedTheme = localStorage.getItem('newsThemePreference');
      const savedViewMode = localStorage.getItem('newsViewModePreference');
      const savedLanguage = localStorage.getItem('newsLanguage');

      if (user?.id && preferences) {
        setShowSummaries(preferences.autoSummarize);
        setGridView(preferences.viewMode === 'grid');
        setLanguage(preferences.language);
        if (preferences.theme === 'dark' && !isDarkMode) {
          toggleDarkMode();
        } else if (preferences.theme === 'light' && isDarkMode) {
          toggleDarkMode();
        }
      } else {
        setShowSummaries(savedSummary !== null ? savedSummary === 'true' : DEFAULT_PREFERENCES.showSummaries);
        setGridView(savedViewMode ? savedViewMode === 'grid' : DEFAULT_PREFERENCES.gridView);
        setLanguage(savedLanguage || DEFAULT_PREFERENCES.language);
        
        const savedThemeValue = savedTheme || DEFAULT_PREFERENCES.theme;
        if (savedThemeValue === 'dark' && !isDarkMode) {
          toggleDarkMode();
        } else if (savedThemeValue === 'light' && isDarkMode) {
          toggleDarkMode();
        }
      }
    }
  }, [isClient, user?.id, preferences]);

  const handleSummariesToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setShowSummaries(newValue);
    localStorage.setItem('newsSummaryPreference', newValue.toString());
  };

  const handleDarkModeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTheme = e.target.checked ? 'dark' : 'light';
    toggleDarkMode();
    localStorage.setItem('newsThemePreference', newTheme);
  };

  const handleViewModeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newViewMode = e.target.checked ? 'grid' : 'list';
    setGridView(e.target.checked);
    localStorage.setItem('newsViewModePreference', newViewMode);
  };

  const handleLanguageChange = async (value: string) => {
    setLanguage(value);
    localStorage.setItem('newsLanguage', value);
  };

  return (
    <div className="flex flex-row flex-wrap items-center gap-4 w-full mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center pl-0">
            <SwitchField
              label={
                <span className={`whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"} -ml-1`}>
                  一鍵總結
                </span>
              }
              labelPosition="start"
              isChecked={showSummaries}
              onChange={handleSummariesToggle}
              className="scale-[0.75]"
            />
          </div>
          <div className="flex items-center">
            <SwitchField
              label={<span className={`whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>檢視收藏</span>}
              labelPosition="start"
              isChecked={showFavorites}
              onChange={(e) => setShowFavorites(e.target.checked)}
              className="scale-[0.75]"
            />
          </div>
          <div className="flex items-center">
            <SwitchField
              label={<span className={`whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>切換主題</span>}
              labelPosition="start"
              isChecked={isDarkMode}
              onChange={handleDarkModeToggle}
              className="scale-[0.75]"
            />
          </div>
          <div className="flex items-center">
            <SwitchField
              label={<span className={`whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>切換視圖</span>}
              labelPosition="start"
              isChecked={gridView}
              onChange={handleViewModeToggle}
              className="scale-[0.75]"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap pl-[0.25rem]">
        <span className={`whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>日期：</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            onDateFilterChange(e.target.value, endDate);
          }}
          className={`${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"} 
            border border-gray-300 rounded-md p-1.5 text-sm w-[120px]
            hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none`}
        />
        <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>至</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            onDateFilterChange(startDate, e.target.value);
          }}
          className={`${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"} 
            border border-gray-300 rounded-md p-1.5 text-sm w-[120px]
            hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none`}
        />
      </div>

      <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap pl-[0.25rem]">
        <div className="flex items-center gap-2">
          <span className={`whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>排序：</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
            className={`${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"} 
              border border-gray-300 rounded-md p-1.5 text-sm w-[100px]
              cursor-pointer hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none`}
          >
            <option value="newest">最新文章</option>
            <option value="oldest">最舊文章</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className={`whitespace-nowrap text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>語言：</span>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className={`${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"} 
              border border-gray-300 rounded-md p-1.5 text-sm w-[100px]
              cursor-pointer hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none`}
          >
            <option value="zh-TW">繁體中文</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"} whitespace-nowrap`}>
          文章數量：{showFavorites ? filteredFavoritesCount : (filteredArticles?.length || 0)}
        </div>
      </div>
    </div>
  );
};

export default Filters;