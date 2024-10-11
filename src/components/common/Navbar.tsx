// src/components/common/Navbar.tsx  
import React from 'react';  
import Link from 'next/link';  
import { Menu, MenuItem, View } from '@aws-amplify/ui-react';  
import { SwitchField } from "@aws-amplify/ui-react";  
import { useAppContext } from '../../context/AppContext'; // Import the context hook  

const Navbar: React.FC = () => {  
  const {  
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
  } = useAppContext(); // Use the context hook to access state  

  const handleDarkModeToggle = (checked: boolean) => {  
    console.log("Dark mode toggled:", checked);  
    setIsDarkMode(checked);  
  };  

  const handleFavoritesToggle = (checked: boolean) => {  
    console.log("Favorites toggled:", checked);  
    setShowFavorites(checked);  
  };  

  const handleGridViewToggle = (checked: boolean) => {  
    console.log("Grid view toggled:", checked);  
    setGridView(checked);  
  };  

  return (  
    <nav className="bg-gray-800 p-4">  
      <div className="container mx-auto flex justify-between items-center flex-wrap">  
        <div className="text-white">  
          <Link href="/" className="text-3xl font-bold">AWS Blog</Link>  
        </div>  
        <div className="space-x-4 flex flex-wrap justify-center lg:justify-end w-full lg:w-auto mt-4 lg:mt-0">  
          <Link href="/announcement" className="text-white hover:underline">最新公告</Link>  
          <Link href="/news" className="text-white hover:underline">最新新聞</Link>  
          <Link href="/knowledge" className="text-white hover:underline">知識集</Link>  
          <Link href="/other" className="text-white hover:underline">其他資源</Link>  
          <Link href="/login" className="text-white hover:underline">登入</Link>  
          <View className="block lg:hidden" width="16rem">  {/* 僅在小屏幕顯示 */}  
            <Menu>  
              <MenuItem>  
                <SwitchField  
                  isDisabled={false}  
                  label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>一鍵總結</span>}  
                  labelPosition="start"  
                  isChecked={showSummaries}  
                  onChange={() => toggleShowSummaries()}  
                />  
              </MenuItem>  
              <MenuItem>  
                <SwitchField  
                  isDisabled={false}  
                  label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>檢視收藏</span>}  
                  labelPosition="start"  
                  isChecked={showFavorites}  
                  onChange={(e) => handleFavoritesToggle(e.target.checked)}  
                />  
              </MenuItem>  
              <MenuItem>  
                <SwitchField  
                  isDisabled={false}  
                  label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>切換主題</span>}  
                  labelPosition="start"  
                  isChecked={isDarkMode}  
                  onChange={(e) => handleDarkModeToggle(e.target.checked)}  
                />  
              </MenuItem>  
              <MenuItem>  
                <SwitchField  
                  isDisabled={false}  
                  label={<span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>切換視圖</span>}  
                  labelPosition="start"  
                  isChecked={gridView}  
                  onChange={(e) => handleGridViewToggle(e.target.checked)}  
                />  
              </MenuItem>  
              <MenuItem>  
                <div className="flex items-center gap-2">  
                  <label className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>日期:</label>  
                  <input  
                    type="date"  
                    value={startDate}  
                    onChange={(e) => {  
                      setStartDate(e.target.value);  
                      onDateFilterChange(e.target.value, endDate);  
                    }}  
                    className={`${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"} border border-gray-300 rounded-md p-2`}  
                  />  
                  <span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>至</span>  
                  <input  
                    type="date"  
                    value={endDate}  
                    onChange={(e) => {  
                      setEndDate(e.target.value);  
                      onDateFilterChange(startDate, e.target.value);  
                    }}  
                    className={`${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"} border border-gray-300 rounded-md p-2`}  
                  />  
                </div>  
              </MenuItem>  
              <MenuItem>  
                <div className="flex items-center gap-2">  
                  <label className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>排序:</label>  
                  <select  
                    value={sortOrder}  
                    onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}  
                    className={`${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"} border border-gray-300 rounded-md p-2`}  
                  >  
                    <option value="newest">最新文章</option>  
                    <option value="oldest">最舊文章</option>  
                  </select>  
                </div>  
              </MenuItem>  
              <MenuItem>  
                <div className="flex items-center gap-2">  
                  <label className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>語言:</label>  
                  <select  
                    value={language}  
                    onChange={(e) => setLanguage(e.target.value)}  
                    className={`${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"} border border-gray-300 rounded-md p-2`}  
                  >  
                    <option value="zh-TW">繁體中文</option>  
                    <option value="en">English</option>  
                  </select>  
                </div>  
              </MenuItem>  
              <MenuItem>  
                <div className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>  
                  文章數量: {showFavorites ? filteredFavoritesCount : (filteredArticles?.length || 0)}  
                </div>  
              </MenuItem>  
            </Menu>  
          </View>  
        </div>  
      </div>  
    </nav>  
  );  
};  

export default Navbar;