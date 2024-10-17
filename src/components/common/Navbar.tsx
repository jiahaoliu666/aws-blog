// // import React, { useState, useEffect, useRef } from 'react';  
// // import Link from 'next/link';  
// // import { Message } from '@aws-amplify/ui-react';  
// // import { useAppContext } from '../../context/AppContext';  
// // import { useAuthContext } from '../../context/AuthContext';  
// // import NewsFilters from '../news/NewsFilters'; // 引入 NewsFilters

// // const Navbar: React.FC = () => {  
// //   const { 
// //     gridView,
// //     isDarkMode,
// //     showFavorites,
// //     setGridView,
// //     setIsDarkMode,
// //     setShowFavorites,
// //     startDate,
// //     endDate,
// //     setStartDate,
// //     setEndDate,
// //     sortOrder,
// //     setSortOrder,
// //     onDateFilterChange,
// //     filteredArticles,
// //     filteredFavoritesCount,
// //     language,
// //     setLanguage,
// //     toggleShowSummaries,
// //     showSummaries,
// //     setShowSummaries
// //   } = useAppContext(); // 從 AppContext 中獲取狀態和函數

// //   const { user, logoutUser } = useAuthContext();  
// //   const [isLogoutMessageVisible, setIsLogoutMessageVisible] = useState(false);  
// //   const [isDropdownOpen, setIsDropdownOpen] = useState(false);  
// //   const [isResourcesDropdownOpen, setIsResourcesDropdownOpen] = useState(false);  
// //   const dropdownRef = useRef<HTMLDivElement>(null);  
// //   const resourcesDropdownRef = useRef<HTMLDivElement>(null);  

// //   const handleLogout = async () => {  
// //     try {  
// //       await logoutUser();  
// //       setIsLogoutMessageVisible(true); // 設置登出訊息可見
// //       setTimeout(() => {
// //         setIsLogoutMessageVisible(false); // 5秒後隱藏訊息
// //       }, 5000);  
// //     } catch (error) {  
// //       console.error('Failed to logout:', error);  
// //     }  
// //   };  

// //   useEffect(() => {  
// //     const handleClickOutside = (event: MouseEvent) => {  
// //       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {  
// //         setIsDropdownOpen(false);  
// //       }  
// //       if (resourcesDropdownRef.current && !resourcesDropdownRef.current.contains(event.target as Node)) {  
// //         setIsResourcesDropdownOpen(false);  
// //       }  
// //     };  
// //     document.addEventListener('mousedown', handleClickOutside);  
// //     return () => {  
// //       document.removeEventListener('mousedown', handleClickOutside);  
// //     };  
// //   }, []);  

// //   return (  
// //     <div>  
// //       {isLogoutMessageVisible && (  
// //         <Message variation="filled" colorTheme="success" heading="登出成功" className="mb-4">  
// //           您已成功登出。  
// //         </Message>  
// //       )}  
// //       <nav className="bg-gray-900 p-4 shadow-md">  
// //         <div className="container mx-auto flex flex-col lg:flex-row justify-between items-center">  
// //           <div className="text-white mb-4 lg:mb-0">  
// //             <Link href="/" className="text-3xl font-bold hover:text-gray-400 transition duration-300">AWS Blog</Link>  
// //           </div>  
// //           <div className="space-x-4 flex flex-col lg:flex-row justify-center lg:justify-end w-full lg:w-auto">  
// //             {user && (
// //               <div className="flex items-center">
// //                 <svg className="w-6 h-6 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
// //                 </svg>
// //                 <span className="text-white text-lg">通知</span>
// //               </div>
// //             )}
// //             <Link href="/announcement" className="text-white hover:text-gray-400 transition duration-300 text-lg">最新公告</Link>  
// //             <Link href="/news" className="text-white hover:text-gray-400 transition duration-300 text-lg">最新新聞</Link>  
// //             <Link href="/solutions" className="text-white hover:text-gray-400 transition duration-300 text-lg">解決方案</Link>
// //             <Link href="/knowledge" className="text-white hover:text-gray-400 transition duration-300 text-lg">知識庫</Link>  
// //             <Link href="/architecture-diagrams" className="text-white hover:text-gray-400 transition duration-300 text-lg">架構圖</Link>
// //             <div className="relative" ref={resourcesDropdownRef}>  
// //               <button onClick={() => setIsResourcesDropdownOpen(!isResourcesDropdownOpen)} className="text-white hover:text-gray-400 transition duration-300 flex items-center text-lg">  
// //                 其他資源  
// //                 <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">  
// //                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />  
// //                 </svg>  
// //               </button>  
// //               {isResourcesDropdownOpen && (  
// //                 <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-20">  
// //                   <div className="py-1"> 
// //                     <Link href="https://docs.aws.amazon.com/" target="_blank" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">AWS 官方文檔</Link>    
// //                     <Link href="https://aws.amazon.com/tw/faqs/?nc1=f_dr" target="_blank" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">AWS 常見問答集</Link>                      
// //                     <Link href="https://status.aws.amazon.com/" target="_blank" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">AWS 服務狀態儀表板</Link>                      
// //                   </div>  
// //                 </div>  
// //               )}  
// //             </div>

// //             {user ? (  
// //               <div className="relative" ref={dropdownRef}>  
// //                 <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="text-white hover:text-gray-400 transition duration-300 flex items-center text-lg">  
// //                   {`Hi，${user.username}`}  
// //                   <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">  
// //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />  
// //                   </svg>  
// //                 </button>  
// //                 {isDropdownOpen && (  
// //                   <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-20">  
// //                     <div className="py-1">  
// //                       <Link href="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">個人資訊</Link>  
// //                       <Link href="/settings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">設定</Link>  
// //                       <div className="border-t border-gray-700"></div>  
// //                       <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">登出</button>  
// //                     </div>  
// //                   </div>  
// //                 )}  
// //               </div>  
// //             ) : (  
// //               <Link href="/auth/login" className="text-white hover:text-gray-400 transition duration-300 text-lg">登入</Link>  
// //             )}  
// //           </div>  
// //         </div>  
// //       </nav>  
// //       {/* 保留 NewsFilters */}
// //       <NewsFilters 
// //         gridView={gridView}
// //         isDarkMode={isDarkMode}
// //         showFavorites={showFavorites}
// //         setGridView={setGridView}
// //         setIsDarkMode={setIsDarkMode}
// //         setShowFavorites={setShowFavorites}
// //         startDate={startDate}
// //         endDate={endDate}
// //         setStartDate={setStartDate}
// //         setEndDate={setEndDate}
// //         sortOrder={sortOrder}
// //         setSortOrder={setSortOrder}
// //         onDateFilterChange={onDateFilterChange}
// //         filteredArticles={filteredArticles}
// //         filteredFavoritesCount={filteredFavoritesCount}
// //         language={language}
// //         setLanguage={setLanguage}
// //         toggleShowSummaries={toggleShowSummaries}
// //         showSummaries={showSummaries}
// //         setShowSummaries={setShowSummaries}
// //       />
// //     </div>  
// //   );  
// // };  

// // export default Navbar;


// src/components/common/Navbar.tsx
import React, { useState, useEffect, useRef } from 'react';  
import Link from 'next/link';  
import { Menu, MenuItem, View, SwitchField, Message } from '@aws-amplify/ui-react';  
import { useAppContext } from '../../context/AppContext';  
import { useAuthContext } from '../../context/AuthContext';  

const Navbar: React.FC = () => {  
  const { gridView, isDarkMode, showFavorites, setGridView, setIsDarkMode, setShowFavorites, startDate, endDate, setStartDate, setEndDate, sortOrder, setSortOrder, onDateFilterChange, filteredArticles, filteredFavoritesCount, language, setLanguage, toggleShowSummaries, showSummaries } = useAppContext();  
  const { user, logoutUser } = useAuthContext();  
  const [isLogoutMessageVisible, setIsLogoutMessageVisible] = useState(false);  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);  
  const [isResourcesDropdownOpen, setIsResourcesDropdownOpen] = useState(false);  
  const dropdownRef = useRef<HTMLDivElement>(null);  
  const resourcesDropdownRef = useRef<HTMLDivElement>(null);  

  const handleLogout = async () => {  
    try {  
      await logoutUser();  
      setIsLogoutMessageVisible(true); // 設置登出訊息可見
      setTimeout(() => {
        setIsLogoutMessageVisible(false); // 5秒後隱藏訊息
      }, 5000);  
    } catch (error) {  
      console.error('Failed to logout:', error);  
    }  
  };  

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
      {isLogoutMessageVisible && (  
        <Message variation="filled" colorTheme="success" heading="登出成功" className="mb-4">  
          您已成功登出。  
        </Message>  
      )}  
      <nav className="bg-gray-900 p-4 shadow-md">  
        <div className="container mx-auto flex flex-col lg:flex-row justify-between items-center">  
          <div className="text-white mb-4 lg:mb-0">  
            <Link href="/" className="text-3xl font-bold hover:text-gray-400 transition duration-300">AWS Blog</Link>  
          </div>  
          <div className="space-x-4 flex flex-col lg:flex-row justify-center lg:justify-end w-full lg:w-auto">  
            {user && (
              <div className="flex items-center">
                <svg className="w-6 h-6 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
                </svg>
                <span className="text-white text-lg">通知</span>
              </div>
            )}
            <Link href="/announcement" className="text-white hover:text-gray-400 transition duration-300 text-lg">最新公告</Link>  
            <Link href="/news" className="text-white hover:text-gray-400 transition duration-300 text-lg">最新新聞</Link>  
            <Link href="/solutions" className="text-white hover:text-gray-400 transition duration-300 text-lg">解決方案</Link>
            <Link href="/knowledge" className="text-white hover:text-gray-400 transition duration-300 text-lg">知識庫</Link>  
            <Link href="/architecture-diagrams" className="text-white hover:text-gray-400 transition duration-300 text-lg">架構圖</Link>
            <div className="relative" ref={resourcesDropdownRef}>  
              <button onClick={() => setIsResourcesDropdownOpen(!isResourcesDropdownOpen)} className="text-white hover:text-gray-400 transition duration-300 flex items-center text-lg">  
                其他資源  
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">  
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />  
                </svg>  
              </button>  
              {isResourcesDropdownOpen && (  
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-20">  
                  <div className="py-1"> 
                    <Link href="https://docs.aws.amazon.com/" target="_blank" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">AWS 官方文檔</Link>    
                    <Link href="https://aws.amazon.com/tw/faqs/?nc1=f_dr" target="_blank" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">AWS 常見問答集</Link>                      
                    <Link href="https://status.aws.amazon.com/" target="_blank" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">AWS 服務狀態儀表板</Link>                      
                  </div>  
                </div>  
              )}  
            </div>


            {user ? (  
              <div className="relative" ref={dropdownRef}>  
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="text-white hover:text-gray-400 transition duration-300 flex items-center text-lg">  
                  {`Hi，${user.username}`}  
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">  
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />  
                  </svg>  
                </button>  
                {isDropdownOpen && (  
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-20">  
                    <div className="py-1">  
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">個人資訊</Link>  
                      <Link href="/settings" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">設定</Link>  
                      <div className="border-t border-gray-700"></div>  
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">登出</button>  
                    </div>  
                  </div>  
                )}  
              </div>  
            ) : (  
              <Link href="/auth/login" className="text-white hover:text-gray-400 transition duration-300 text-lg">登入</Link>  
            )}  
          </div>  

          {/* 手機顯示的設定選項 */}
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
      </nav>  
    </div>  
  );  
};  

export default Navbar;