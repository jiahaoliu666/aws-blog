// src/components/common/Navbar.tsx  
import React, { useState, useEffect, useRef } from 'react';  
import Link from 'next/link';  
import { Menu, MenuItem, View, SwitchField, Message } from '@aws-amplify/ui-react';  
import { useAppContext } from '../../context/AppContext';  
import { useAuthContext } from '../../context/AuthContext';  
import { useUserContext } from '../../context/UserContext';  // 使用 UserContext  

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
  } = useAppContext();  

  const { user, logoutUser } = useAuthContext();  
  const { username, setUsername } = useUserContext();  // 取得並設定用戶名  
  const [isLoggedOut, setIsLoggedOut] = useState(false);  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);  
  const [isResourcesDropdownOpen, setIsResourcesDropdownOpen] = useState(false);  // 新增狀態  
  const dropdownRef = useRef<HTMLDivElement>(null);  
  const resourcesDropdownRef = useRef<HTMLDivElement>(null);  // 新增引用  

  const handleLogout = async () => {  
    try {  
      await logoutUser();  
      setUsername('');  // 清除用戶名  
      setIsLoggedOut(true);  
    } catch (error) {  
      console.error('Failed to logout:', error);  
    }  
  };  

  useEffect(() => {  
    if (isLoggedOut) {  
      const timer = setTimeout(() => {  
        setIsLoggedOut(false);  
      }, 5000);  
      return () => clearTimeout(timer);  
    }  
  }, [isLoggedOut]);  

  useEffect(() => {  
    const handleClickOutside = (event: MouseEvent) => {  
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {  
        setIsDropdownOpen(false);  
      }  
      if (resourcesDropdownRef.current && !resourcesDropdownRef.current.contains(event.target as Node)) {  
        setIsResourcesDropdownOpen(false);  
      }  
    };  

    document.addEventListener('mousedown', handleClickOutside);  
    return () => {  
      document.removeEventListener('mousedown', handleClickOutside);  
    };  
  }, []);  

  const handleToggle = (setter: (value: boolean) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {  
    const checked = e.target.checked;  
    setter(checked);  
  };  

  const menuItemClasses = `${isDarkMode ? "text-gray-300" : "text-gray-700"}`;  
  const inputClasses = `${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-900"} border border-gray-300 rounded-md p-2`;  

  return (  
    <div>  
      {isLoggedOut && (  
        <Message variation="filled" colorTheme="success" heading="登出成功" className="mb-4">  
          您已成功登出。  
        </Message>  
      )}  
      <nav className="bg-gray-800 p-4">  
        <div className="container mx-auto flex justify-between items-center flex-wrap">  
          <div className="text-white">  
            <Link href="/" className="text-3xl font-bold">AWS Blog</Link>  
          </div>  
          <div className="space-x-4 flex flex-wrap justify-center lg:justify-end w-full lg:w-auto mt-4 lg:mt-0">  
            <Link href="/announcement" className="text-white hover:underline">最新公告</Link>  
            <Link href="/news" className="text-white hover:underline">最新新聞</Link>  
            <Link href="/knowledge" className="text-white hover:underline">知識庫</Link>  

            <div className="relative" ref={resourcesDropdownRef}>  
              <button onClick={() => setIsResourcesDropdownOpen(!isResourcesDropdownOpen)} className="text-white hover:underline flex items-center">  
                其他資源  
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">  
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />  
                </svg>  
              </button>  
              {isResourcesDropdownOpen && (  
                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-20">  
                  <div className="py-1">  
                    <Link href="/resource1" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">資源 1</Link>  
                    <Link href="/resource2" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">資源 2</Link>  
                    <Link href="/resource3" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">資源 3</Link>  
                  </div>  
                </div>  
              )}  
            </div>  

            {user ? (  
              <div className="relative" ref={dropdownRef}>  
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="text-white hover:underline flex items-center">  
                  {username ? `Hi, ${username}` : '用戶'} {/* 顯示用戶名，前面加上 Hi */}  
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">  
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />  
                  </svg>  
                </button>  
                {isDropdownOpen && (  
                  <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-20">  
                    <div className="py-1">  
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">個人資訊</Link>  
                      <Link href="/library" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">設定</Link>  
                      <div className="border-t border-gray-600"></div>  
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">登出</button>  
                    </div>  
                  </div>  
                )}  
              </div>  
            ) : (  
              <Link href="/auth/login" className="text-white hover:underline">登入</Link>  
            )}  

            <View className="block lg:hidden" width="16rem">  
              <Menu>  
                <MenuItem>  
                  <SwitchField  
                    isDisabled={false}  
                    label={<span className={menuItemClasses}>一鍵總結</span>}  
                    labelPosition="start"  
                    isChecked={showSummaries}  
                    onChange={toggleShowSummaries}  
                  />  
                </MenuItem>  
                <MenuItem>  
                  <SwitchField  
                    isDisabled={false}  
                    label={<span className={menuItemClasses}>檢視收藏</span>}  
                    labelPosition="start"  
                    isChecked={showFavorites}  
                    onChange={handleToggle(setShowFavorites)}  
                  />  
                </MenuItem>  
                <MenuItem>  
                  <SwitchField  
                    isDisabled={false}  
                    label={<span className={menuItemClasses}>切換主題</span>}  
                    labelPosition="start"  
                    isChecked={isDarkMode}  
                    onChange={handleToggle(setIsDarkMode)}  
                  />  
                </MenuItem>  
                <MenuItem>  
                  <SwitchField  
                    isDisabled={false}  
                    label={<span className={menuItemClasses}>切換視圖</span>}  
                    labelPosition="start"  
                    isChecked={gridView}  
                    onChange={handleToggle(setGridView)}  
                  />  
                </MenuItem>  
                <MenuItem>  
                  <div className="flex items-center gap-2">  
                    <label className={menuItemClasses}>日期:</label>  
                    <input  
                      type="date"  
                      value={startDate}  
                      onChange={(e) => {  
                        setStartDate(e.target.value);  
                        onDateFilterChange(e.target.value, endDate);  
                      }}  
                      className={inputClasses}  
                    />  
                    <span className={menuItemClasses}>至</span>  
                    <input  
                      type="date"  
                      value={endDate}  
                      onChange={(e) => {  
                        setEndDate(e.target.value);  
                        onDateFilterChange(startDate, e.target.value);  
                      }}  
                      className={inputClasses}  
                    />  
                  </div>  
                </MenuItem>  
                <MenuItem>  
                  <div className="flex items-center gap-2">  
                    <label className={menuItemClasses}>排序:</label>  
                    <select  
                      value={sortOrder}  
                      onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}  
                      className={inputClasses}  
                    >  
                      <option value="newest">最新文章</option>  
                      <option value="oldest">最舊文章</option>  
                    </select>  
                  </div>  
                </MenuItem>  
                <MenuItem>  
                  <div className="flex items-center gap-2">  
                    <label className={menuItemClasses}>語言:</label>  
                    <select  
                      value={language}  
                      onChange={(e) => setLanguage(e.target.value)}  
                      className={inputClasses}  
                    >  
                      <option value="zh-TW">繁體中文</option>  
                      <option value="en">English</option>  
                    </select>  
                  </div>  
                </MenuItem>  
                <MenuItem>  
                  <div className={menuItemClasses}>  
                    文章數量: {showFavorites ? filteredFavoritesCount : (filteredArticles?.length || 0)}  
                  </div>  
                </MenuItem>  
              </Menu>  
            </View>  
          </div>  
        </div>  
      </nav>  
    </div>  
  );  
};  

export default Navbar;


