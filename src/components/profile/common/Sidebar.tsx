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
    { tab: 'feedback', label: '意見反饋', icon: faCommentDots },
    { tab: 'activityLog', label: '活動日誌', icon: faClock }
  ];

  return (
    <div className="w-full lg:w-1/4 bg-gradient-to-b from-gray-800 to-gray-900 text-white rounded-2xl shadow-2xl p-6">
      {/* 用戶資訊區塊 - 改善視覺層次和間距 */}
      <div className="flex items-center space-x-5 mb-8 p-5 bg-gray-800/50 rounded-xl border border-gray-700/50 backdrop-blur-sm">
        <div className="relative">
          <img
            src={currentAvatar || '/images/default-avatar.png'}
            alt="Profile"
            className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800 transition-transform hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/images/default-avatar.png';
            }}
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-lg">{formData.username}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{formData.email}</p>
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
            <span>定期更新個人資料以確保資訊準確</span>
          </li>
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