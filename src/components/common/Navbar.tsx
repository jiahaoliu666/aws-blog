// src/components/common/Navbar.tsx
import React, { useState, useEffect, useRef } from 'react';  
import Link from 'next/link';  
import { useAppContext } from '../../context/AppContext';  
import { useAuthContext } from '../../context/AuthContext';  
import { useNewsFavorites } from '../../hooks/news/useNewsFavorites';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb'; // 正確的導入
import logActivity from '../../pages/api/profile/activity-log'; // 新增這行
import Notification from './Notification';

interface NavbarProps {
  setCurrentSourcePage?: (sourcePage: string) => void; // 將其設為可選
}

const Navbar: React.FC<NavbarProps> = ({ setCurrentSourcePage }) => {  
  const { isDarkMode } = useAppContext();  
  const { user, logoutUser } = useAuthContext();  
  const { setFavorites } = useNewsFavorites();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);  
  const [isResourcesDropdownOpen, setIsResourcesDropdownOpen] = useState(false);  
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);  
  const resourcesDropdownRef = useRef<HTMLDivElement>(null);  
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    const fetchAvatar = async () => {
      if (user) {
        const dynamoClient = new DynamoDBClient({
          region: 'ap-northeast-1',
          credentials: {
            accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
          },
        });

        const queryParams = {
          TableName: 'AWS_Blog_UserProfiles',
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': { S: user.sub },
          },
        };

        try {
          const command = new QueryCommand(queryParams);
          const response = await dynamoClient.send(command);
          let fetchedAvatarUrl = 'user.png'; // 默認頭像

          if (response.Items && response.Items.length > 0) {
            const avatarFromDB = response.Items[0].avatarUrl?.S;
            if (avatarFromDB) {
              fetchedAvatarUrl = avatarFromDB;
            }
          }

          setAvatarUrl(fetchedAvatarUrl);
          localStorage.setItem('avatarUrl', fetchedAvatarUrl);
        } catch (error) {
          console.error('Error fetching avatar from DynamoDB:', error);
        }
      }
    };

    fetchAvatar();
  }, [user]);

  const handleLogout = async () => {  
    try {  
      await logoutUser();  
      localStorage.clear();
      setFavorites([]);
      if (user) {
        alert('您已成功登出!');
        await logActivity(user.sub, '登出帳戶');
      }
      window.location.reload();
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
      if (isNotificationOpen && !(event.target as Element)?.closest('.notification-container')) {
        setIsNotificationOpen(false);
      }
    };  
    document.addEventListener('mousedown', handleClickOutside);  
    return () => {  
      document.removeEventListener('mousedown', handleClickOutside);  
    };  
  }, [isNotificationOpen]);  

  const menuItemClasses = `${isDarkMode ? "text-gray-300" : "text-gray-700"}`;  

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLinkClick = (sourcePage: string) => {
    if (setCurrentSourcePage) {
      setCurrentSourcePage(sourcePage);
    }
  };

  const toggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  return (  
    <div id="navbar">  
      <nav className="bg-gray-900 p-4 shadow-md">  
        <div className="container mx-auto flex flex-col lg:flex-row justify-between items-center flex-wrap">  
          <div className="flex items-center w-full lg:w-auto">
            <button onClick={toggleMenu} className="text-white hover:text-gray-200 transition duration-300 transform hover:scale-105 lg:hidden p-2 border rounded mr-4 ml-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={`w-6 h-6 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 5.25h16.5m-16.5 6.75h16.5m-16.5 6.75h16.5"
                />
              </svg>
            </button>
            <Link href="/" className="text-3xl font-bold text-white hover:text-gray-400 transition duration-300">AWS Blog</Link>  
          </div>
          <div className={`lg:flex ${isMenuOpen ? 'flex' : 'hidden'} flex-col lg:flex-row justify-end w-full lg:w-auto space-y-4 lg:space-y-0 lg:space-x-4 ml-6 lg:ml-0`}>
            {user && (
              <div className="relative notification-container">
                <button onClick={toggleNotification} className="text-white hover:text-gray-400 transition duration-300 text-lg mt-4 lg:mt-0">
                  通知
                </button>
                {isNotificationOpen && <Notification notifications={[]} />}
              </div>
            )}
            <Link href="/announcement" className="text-white hover:text-gray-400 transition duration-300 text-lg mt-4 lg:mt-0" onClick={() => handleLinkClick('最新公告')}>最新公告</Link>  
            <Link href="/news" className="text-white hover:text-gray-400 transition duration-300 text-lg" onClick={() => handleLinkClick('最新新聞')}>最新新聞</Link>  
            <Link href="/solutions" className="text-white hover:text-gray-400 transition duration-300 text-lg" onClick={() => handleLinkClick('解決方案')}>解決方案</Link>
            <Link href="/knowledge" className="text-white hover:text-gray-400 transition duration-300 text-lg" onClick={() => handleLinkClick('知識庫')}>知識庫</Link>  
            <Link href="/architecture-diagrams" className="text-white hover:text-gray-400 transition duration-300 text-lg" onClick={() => handleLinkClick('架構圖')}>架構圖</Link>
            <div className="relative" ref={resourcesDropdownRef}>  
              <button onClick={() => setIsResourcesDropdownOpen(!isResourcesDropdownOpen)} className="text-white hover:text-gray-400 transition duration-300 flex items-center text-lg">  
                其他資源  
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">  
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />  
                </svg>  
              </button>  
              {isResourcesDropdownOpen && (  
                <div className="flex flex-col mt-2 space-y-2 lg:absolute lg:right-0 lg:mt-2 lg:w-48 lg:bg-gray-800 lg:rounded-md lg:shadow-lg lg:z-20 lg:py-1">  
                  <Link href="https://docs.aws.amazon.com/" target="_blank" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">AWS 官方文檔</Link>    
                  <Link href="https://aws.amazon.com/tw/faqs/?nc1=f_dr" target="_blank" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">AWS 常見問答集</Link>                      
                  <Link href="https://status.aws.amazon.com/" target="_blank" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">AWS 服務狀態儀表板</Link>                      
                </div>  
              )}  
            </div>

            {user ? (  
              <div className="relative" ref={dropdownRef}>  
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="text-white hover:text-gray-400 transition duration-300 flex items-center text-lg">  
                  {avatarUrl && (
                    <img
                      src={avatarUrl}
                      alt="用戶頭像"
                      className="w-8 h-8 rounded-full mr-2 max-w-full"
                    />
                  )}
                  Hi，
                  {`${user.username}`}  
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">  
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />  
                  </svg>  
                </button>  
                {isDropdownOpen && (  
                  <div className="flex flex-col mt-2 space-y-2 lg:absolute lg:right-0 lg:mt-2 lg:w-48 lg:bg-gray-800 lg:rounded-md lg:shadow-lg lg:z-20 lg:py-1">  
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">個人資訊</Link>
                    <Link href="/bookmark" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">收藏文章</Link>  
                    <Link href="/notifications" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">所有通知</Link>   
                    <Link href="/exam" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">考試題庫</Link>   
                    <Link href="/history" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">版本歷史</Link>   
                    <div className="border-t border-gray-700"></div>  
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">登出</button>  
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
