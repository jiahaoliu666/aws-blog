import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faLock, 
  faBell, 
  faCog, 
  faEye, 
  faCommentDots, 
  faClock,
  faUserCog 
} from '@fortawesome/free-solid-svg-icons';
import { FormData } from '@/types/profileTypes';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  formData: FormData;
  tempAvatar?: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
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
    { tab: 'preferences', label: '偏好設定', icon: faCog },
    { tab: 'history', label: '觀看紀錄', icon: faEye },
    { tab: 'activityLog', label: '活動日誌', icon: faClock },
    { tab: 'feedback', label: '意見反饋', icon: faCommentDots },
    { tab: 'accountManagement', label: '帳號管理', icon: faUserCog }
  ];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="
      w-full lg:w-1/4 
      bg-gradient-to-br from-gray-800/95 via-gray-850 to-gray-900/95
      backdrop-blur-sm
      text-white rounded-xl lg:rounded-2xl 
      shadow-lg lg:shadow-2xl 
      p-3.5 lg:p-6 
      min-h-fit lg:min-h-[calc(100vh-8rem)]
      flex flex-col
      relative
    ">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800/95 via-gray-850 to-gray-900/95 rounded-xl lg:rounded-2xl -z-10" />
      
      <div className="relative mb-4 lg:mb-8 flex-shrink-0">
        <div className="flex items-center p-2 lg:flex-col lg:items-center lg:p-4">
          <div className="relative group">
            <div className="relative">
              <img
                src={currentAvatar || '/images/default-avatar.png'}
                alt="Profile"
                className="
                  w-14 h-14 lg:w-20 lg:h-20 
                  rounded-full object-cover 
                  ring-2 ring-blue-500/70 
                  ring-offset-2 ring-offset-gray-800 
                  transition-all duration-300 
                  group-hover:scale-105 
                  shadow-md
                "
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/default-avatar.png';
                }}
              />
              <div className="absolute -bottom-1 -right-1 lg:-bottom-1 lg:-right-1 w-3.5 h-3.5 lg:w-4 lg:h-4 bg-green-500 rounded-full border-2 border-gray-800 shadow-sm">
                <span className="absolute inset-0 rounded-full animate-ping bg-green-500 opacity-75"></span>
              </div>
            </div>
          </div>
          
          <div className="ml-3.5 lg:ml-0 lg:text-center lg:mt-4">
            <h2 className="font-semibold text-base lg:text-xl tracking-wide mb-1 lg:mb-1">
              {formData.username}
            </h2>
            <div className="flex items-center space-x-1.5 text-sm lg:text-sm text-gray-400/90">
              <svg 
                className="w-4 h-4 hidden lg:block" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <span className="truncate max-w-[180px] lg:max-w-[200px]">{formData.email}</span>
            </div>
          </div>
        </div>
      </div>

      <ul className="
        space-y-2 lg:space-y-2.5 
        custom-scrollbar
        block
        max-h-[calc(100vh-12rem)] lg:max-h-[calc(100vh-16rem)]
        overflow-y-auto
        flex-grow
        relative
        mb-2 lg:mb-4
        px-1.5 lg:px-0
      ">
        {menuItems.map(({ tab, label, icon }, index) => (
          <li
            key={tab}
            className={`
              p-3 lg:p-4 
              cursor-pointer 
              rounded-lg lg:rounded-xl 
              transition-all duration-300 
              flex items-center 
              space-x-3 lg:space-x-4 
              group
              animate-slide-in
              ${activeTab === tab 
                ? 'bg-blue-600/90 text-white shadow-md shadow-blue-500/20' 
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }
            `}
            style={{ 
              animationDelay: `${index * 0.05}s`
            }}
            onClick={() => handleTabChange(tab)}
          >
            <FontAwesomeIcon 
              icon={icon} 
              className={`text-base lg:text-lg ${
                activeTab === tab ? 'text-white' : 'text-gray-400 group-hover:text-white'
              }`} 
            />
            <span className="font-medium text-base lg:text-base">{label}</span>
          </li>
        ))}
      </ul>

      <div className="h-2 lg:h-4 flex-shrink-0" />
    </div>
  );
};

export default Sidebar;