import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faLock, 
  faBell, 
  faCog, 
  faEye, 
  faCommentDots, 
  faClock,
  faUserCog,
  faBars,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { FormData } from '@/types/profileTypes';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isProfileMenuOpen: boolean;
  setIsProfileMenuOpen: Dispatch<SetStateAction<boolean>>;
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
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(
    'https://aws-blog-avatar.s3.ap-northeast-1.amazonaws.com/user.png'
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
      setCurrentAvatar(savedAvatar);
    } else {
      setCurrentAvatar(tempAvatar ?? formData.avatar ?? 'https://aws-blog-avatar.s3.ap-northeast-1.amazonaws.com/user.png');
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
    setIsMobileMenuOpen(false);
    
    const event = new CustomEvent('sectionChange', { 
      detail: tab 
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="relative w-full lg:w-1/4">
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 
          p-3 rounded-xl
          bg-gradient-to-br from-blue-600 to-blue-700
          text-white 
          ring-2 ring-blue-400/30
          hover:from-blue-500 hover:to-blue-600
          active:from-blue-700 active:to-blue-800
          transition-all duration-200 
          hover:scale-105 active:scale-95 
          shadow-lg shadow-blue-500/20
          backdrop-blur-sm"
      >
        <FontAwesomeIcon 
          icon={isMobileMenuOpen ? faTimes : faBars} 
          className="text-xl text-white drop-shadow-md
            transition-transform duration-200
            hover:rotate-180"
        />
      </button>

      <div className={`
        fixed lg:sticky lg:top-0 left-0 
        w-[85vw] sm:w-[380px] lg:w-auto h-screen
        bg-gradient-to-br from-gray-800/95 via-gray-850 to-gray-900/95
        backdrop-blur-sm text-white 
        rounded-r-2xl lg:rounded-2xl 
        shadow-2xl
        p-5 lg:p-6 
        transform transition-all duration-300 ease-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:block z-40
      `}>
        <div className="h-full flex flex-col">
          <div className="flex-shrink-0 mb-6 lg:mb-8">
            <div className="flex items-center lg:flex-col lg:items-center lg:p-4">
              <div className="relative group">
                <div className="relative">
                  <img
                    src={currentAvatar || 'https://aws-blog-avatar.s3.ap-northeast-1.amazonaws.com/user.png'}
                    alt="Profile"
                    className="w-16 h-16 lg:w-20 lg:h-20 rounded-full object-cover 
                      ring-2 ring-blue-500/70 ring-offset-2 ring-offset-gray-800 
                      transition-all duration-300 group-hover:scale-105 shadow-md"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://aws-blog-avatar.s3.ap-northeast-1.amazonaws.com/user.png';
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 lg:-bottom-1 lg:-right-1 w-4 h-4 
                    bg-green-500 rounded-full border-2 border-gray-800 shadow-sm">
                    <span className="absolute inset-0 rounded-full animate-ping bg-green-500 opacity-75"></span>
                  </div>
                </div>
              </div>
              
              <div className="ml-4 lg:ml-0 lg:text-center lg:mt-4">
                <h2 className="font-semibold text-lg lg:text-xl tracking-wide mb-1">
                  {formData.username}
                </h2>
                <div className="text-sm text-gray-400/90">
                  <span className="truncate max-w-[200px] lg:max-w-[200px]">{formData.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto">
            <ul className="space-y-2.5">
              {menuItems.map(({ tab, label, icon }, index) => (
                <li
                  key={tab}
                  className={`
                    p-4 cursor-pointer rounded-xl
                    transition-all duration-200 
                    flex items-center space-x-4
                    group animate-slide-in
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
                    className={`text-lg ${
                      activeTab === tab ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    }`} 
                  />
                  <span className="font-medium text-base">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden
            transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Sidebar;