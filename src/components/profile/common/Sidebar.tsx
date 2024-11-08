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
  const [currentAvatar, setCurrentAvatar] = useState(tempAvatar || formData.avatar);

  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent) => {
      setCurrentAvatar(event.detail);
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
    <div className="w-full lg:w-1/4 bg-gray-800 text-white rounded-xl shadow-xl p-4">
      {/* 用戶資訊 */}
      <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-700 rounded-lg">
        <img
          src={currentAvatar || '/images/default-avatar.png'}
          alt="Profile"
          className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
        />
        <div>
          <h2 className="font-semibold">{formData.username}</h2>
          <p className="text-sm text-gray-400">{formData.email}</p>
        </div>
      </div>

      {/* 手機版選單按鈕 */}
      <button
        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
        className="w-full text-white hover:text-gray-200 transition duration-300 flex items-center justify-between p-3 rounded-lg bg-gray-600 lg:hidden mb-4"
      >
        <span className="text-sm sm:text-base">個人選單</span>
        <svg 
          className={`w-4 h-4 sm:w-5 sm:h-5 transform transition-transform duration-200 ${
            isProfileMenuOpen ? 'rotate-180' : ''
          }`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M19 9l-7 7-7-7" 
          />
        </svg>
      </button>

      {/* 選單列表 */}
      <ul className={`space-y-2 ${isProfileMenuOpen ? 'block' : 'hidden'} lg:block`}>
        {menuItems.map(({ tab, label, icon }) => (
          <li
            key={tab}
            className={`
              p-3 cursor-pointer rounded-lg transition-colors duration-300 
              flex items-center space-x-3
              ${activeTab === tab 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }
            `}
            onClick={() => {
              setActiveTab(tab);
              setIsProfileMenuOpen(false);
            }}
          >
            <FontAwesomeIcon icon={icon} />
            <span>{label}</span>
          </li>
        ))}
      </ul>

      {/* 提示資訊 */}
      <div className="mt-6 p-4 bg-gray-700 rounded-lg text-sm text-gray-300">
        <h3 className="font-medium text-white mb-2">提示</h3>
        <ul className="space-y-2">
          <li>• 定期更新個人資料以確保資訊準確</li>
          <li>• 建議定期更改密碼以提高帳戶安全性</li>
          <li>• 有任何問題歡迎透過意見反饋與我們聯繫</li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;