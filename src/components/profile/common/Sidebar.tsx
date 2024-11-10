import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faLock, 
  faBell, 
  faCog, 
  faEye, 
  faCommentDots, 
  faClock 
} from '@fortawesome/free-solid-svg-icons';
import { FormData } from '@/types/profileTypes';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isProfileMenuOpen: boolean;
  setIsProfileMenuOpen: (isOpen: boolean) => void;
  formData: FormData;
  tempAvatar?: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isProfileMenuOpen,
  setIsProfileMenuOpen,
  formData,
  tempAvatar
}) => {
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);

  useEffect(() => {
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
      setCurrentAvatar(savedAvatar);
    } else {
      setCurrentAvatar(tempAvatar ?? formData.avatar ?? null);
    }
  }, [tempAvatar, formData.avatar]);

  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent) => {
      const newAvatarUrl = event.detail;
      setCurrentAvatar(newAvatarUrl);
      localStorage.setItem('userAvatar', newAvatarUrl);
    };

    window.addEventListener('avatarUpdate', handleAvatarUpdate as EventListener);

    return () => {
      window.removeEventListener('avatarUpdate', handleAvatarUpdate as EventListener);
    };
  }, []);

  const menuItems = [
    { tab: 'profile', label: '個人資訊', icon: faUser },
    { tab: 'changePassword', label: '修改密碼', icon: faLock },
    { tab: 'notificationSettings', label: '訂閱通知', icon: faBell },
    { tab: 'settings', label: '偏好設定', icon: faCog },
    { tab: 'history', label: '觀看紀錄', icon: faEye },
    { tab: 'activityLog', label: '活動日誌', icon: faClock },
    { tab: 'feedback', label: '意見反饋', icon: faCommentDots }
  ];

  return (
    <div className="w-full lg:w-1/4 bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 text-white rounded-2xl shadow-2xl p-6">
      {/* 用戶資訊區塊 - 簡潔設計 */}
      <div className="relative mb-8">
        <div className="flex flex-col items-center p-4">
          <div className="relative group mb-4">
            <div className="relative">
              <img
                src={currentAvatar || '/images/default-avatar.png'}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover ring-2 ring-blue-500/80 ring-offset-2 ring-offset-gray-800 transition-all duration-300 group-hover:scale-105 shadow-xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/default-avatar.png';
                }}
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-800 shadow-lg">
                <span className="absolute inset-0 rounded-full animate-ping bg-green-500 opacity-75"></span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="font-semibold text-xl tracking-wide mb-2">
              {formData.username}
            </h2>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400 hover:text-gray-300 transition-colors duration-300">
              <svg 
                className="w-4 h-4" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <span className="truncate max-w-[200px]">{formData.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 手機版選單按鈕 - 改善互動效果 */}
      <button
        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
        className="w-full text-white hover:bg-gray-700/50 transition-all duration-300 flex items-center justify-between p-4 rounded-xl border border-gray-700/30 backdrop-blur-sm lg:hidden mb-6"
      >
        <span className="text-base font-medium">個人選單</span>
        <svg 
          className={`w-5 h-5 transform transition-all duration-300 ${
            isProfileMenuOpen ? 'rotate-180' : ''
          }`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 選單列表 - 改善視覺效果和互動體驗 */}
      <ul className={`space-y-2.5 ${isProfileMenuOpen ? 'block' : 'hidden'} lg:block`}>
        {menuItems.map(({ tab, label, icon }) => (
          <li
            key={tab}
            className={`
              p-4 cursor-pointer rounded-xl transition-all duration-300 
              flex items-center space-x-4 group
              ${activeTab === tab 
                ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-500/20' 
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }
            `}
            onClick={() => {
              setActiveTab(tab);
              setIsProfileMenuOpen(false);
            }}
          >
            <FontAwesomeIcon icon={icon} className={`text-lg ${activeTab === tab ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
            <span className="font-medium">{label}</span>
          </li>
        ))}
      </ul>

      {/* 提示資訊 - 改善視覺呈現 */}
      <div className="mt-8 p-5 bg-gray-800/50 rounded-xl border border-gray-700/50 backdrop-blur-sm">
        <h3 className="font-medium text-white mb-3 flex items-center space-x-2">
          <FontAwesomeIcon icon={faBell} className="text-blue-400" />
          <span>提示</span>
        </h3>
        <ul className="space-y-3 text-sm text-gray-300">
          <li className="flex items-start space-x-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>建議定期更改密碼以提高帳戶安全性</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>有任何問題歡迎透過意見反饋與我們聯繫</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;