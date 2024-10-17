// src/components/common/Navbar.tsx
import React, { useState, useEffect, useRef } from 'react';  
import Link from 'next/link';  
import { useAppContext } from '../../context/AppContext';  
import { useAuthContext } from '../../context/AuthContext';  
import { useNewsFavorites } from '../../hooks/news/useNewsFavorites'; // 引入 useNewsFavorites

const Navbar: React.FC = () => {  
  const { isDarkMode } = useAppContext();  
  const { user, logoutUser } = useAuthContext();  
  const { setFavorites } = useNewsFavorites(); // 使用 setFavorites 來重置收藏狀態
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);  
  const [isResourcesDropdownOpen, setIsResourcesDropdownOpen] = useState(false);  
  const dropdownRef = useRef<HTMLDivElement>(null);  
  const resourcesDropdownRef = useRef<HTMLDivElement>(null);  

  const handleLogout = async () => {  
    try {  
      await logoutUser();  
      localStorage.clear(); // 清除所有localStorage中的資料
      setFavorites([]); // 重置收藏狀態
      alert('您已成功登出!'); // 使用 alert 顯示登出訊息
      window.location.reload(); // 刷新頁面以重新渲染狀態
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

  const menuItemClasses = `${isDarkMode ? "text-gray-300" : "text-gray-700"}`;  

  return (  
    <div>  
      <nav className="bg-gray-900 p-4 shadow-md">  
        <div className="container mx-auto flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">  
          <div className="text-white mb-4 lg:mb-0">  
            <Link href="/" className="text-3xl font-bold hover:text-gray-400 transition duration-300">AWS Blog</Link>  
          </div>  
          <div className="space-y-4 lg:space-y-0 lg:space-x-4 flex flex-col lg:flex-row justify-center lg:justify-end w-full lg:w-auto">  
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
        </div>  
      </nav>  
    </div>  
  );  
};  

export default Navbar;
