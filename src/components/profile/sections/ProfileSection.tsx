import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCamera, 
  faEdit, 
  faCheck, 
  faTimes,
  faSpinner,
  faExclamationTriangle,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { FormData } from '@/types/profileTypes';
import { useToastContext } from '@/context/ToastContext';
import { useAuthContext } from '@/context/AuthContext';
import { SectionTitle } from '../common/SectionTitle';
import { Card } from '../common/Card';
import { userApi } from '@/api/user';

interface ProfileSectionProps {
  formData: FormData;
  isEditable: {
    username: boolean;
  };
  localUsername: string;
  setLocalUsername: (username: string) => void;
  handleAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  toggleEditableField: (field: string) => void;
  handleSaveProfileChanges: (username: string) => void;
  handleCancelChanges: () => void;
  resetUsername: () => void;
  isLoading?: boolean;
  uploadMessage?: string | null;
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  errorMessage?: string;
  tempAvatar?: string | null;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  setIsEditable: React.Dispatch<React.SetStateAction<{ username: boolean }>>;
  handleEditClick: (field: string) => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  formData,
  isEditable,
  localUsername,
  setLocalUsername,
  handleAvatarChange,
  handleSaveProfileChanges,
  handleCancelChanges,
  isLoading,
  tempAvatar,
  handleEditClick
}) => {
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(
    'https://aws-blog-avatar.s3.ap-northeast-1.amazonaws.com/user.png'
  );
  const { showToast } = useToastContext();
  const { user, updateUser } = useAuthContext();
  const [profileData, setProfileData] = useState<{ registrationDate?: string }>({});

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

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.sub) {
        try {
          const data = await userApi.getUserProfile(user.sub);
          setProfileData(data);
        } catch (error) {
          console.error('取得用戶資料失敗:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user?.sub]);

  const handleSave = async () => {
    try {
      await handleSaveProfileChanges(localUsername);
      updateUser({ username: localUsername });
    } catch (error) {
      showToast('儲存失敗', 'error');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) {
      console.warn('註冊日期未定義');
      return '未知日期';
    }

    try {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        return `${year}年${parseInt(month)}月${parseInt(day)}日`;
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error('無效的日期格式:', dateString);
        return '未知日期';
      }

      return new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('日期格式化錯誤:', error);
      return '未知日期';
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <SectionTitle 
          title="個人資訊"
          description="在此查看您的個人資料"
        />
      </div>

      <Card>
        <div className="p-8">
          {/* 頭像與基本資料區塊 */}
          <div className="flex flex-col lg:flex-row gap-12">
            {/* 左側頭像區塊 */}
            <div className="flex flex-col items-center space-y-6">
              <div className="relative group">
                <div className="relative w-48 h-48 rounded-full overflow-hidden ring-4 ring-gray-50 shadow-lg">
                  <img
                    src={currentAvatar || 'https://aws-blog-avatar.s3.ap-northeast-1.amazonaws.com/user.png'}
                    alt="個人頭像"
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://aws-blog-avatar.s3.ap-northeast-1.amazonaws.com/user.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 
                    transition-all duration-300 flex items-center justify-center">
                    <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 
                      transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      更換頭像
                    </span>
                  </div>
                </div>
                
                <label className="absolute bottom-2 right-2 flex items-center justify-center w-12 h-12 
                  bg-white/95 backdrop-blur-sm rounded-full shadow-lg cursor-pointer
                  hover:bg-blue-50 hover:scale-105 active:scale-95
                  ring-2 ring-white/50 hover:ring-blue-200
                  transform transition-all duration-200 ease-out
                  disabled:opacity-50 disabled:cursor-not-allowed
                  group">
                  <FontAwesomeIcon 
                    icon={isLoading ? faSpinner : faCamera} 
                    className={`text-blue-600 text-xl group-hover:text-blue-700
                      ${isLoading ? 'animate-spin' : 'group-hover:rotate-12 transition-transform duration-200'}`}
                  />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/jpeg, image/png" 
                    onChange={handleAvatarChange}
                    disabled={isLoading}
                  />
                </label>
              </div>
              
            </div>

            {/* 右側個人資料表單 */}
            <div className="flex-1 space-y-8">
              <div className="space-y-6">
                {/* 用戶名稱 */}
                <div className="grid grid-cols-[80px_1fr] items-center">
                  <label className="text-sm font-medium text-gray-700">用戶名稱：</label>
                  {isEditable.username ? (
                    <div className="flex-1">
                      <div className="flex gap-3">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={localUsername}
                            onChange={(e) => setLocalUsername(e.target.value)}
                            maxLength={10}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg
                              focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                              transition duration-150"
                            disabled={isLoading}
                            placeholder="請輸入用戶名稱"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                            {`${localUsername.length}/10`}
                          </span>
                        </div>
                        <button
                          onClick={handleSave}
                          disabled={isLoading || !localUsername.trim() || localUsername.length > 10}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg 
                            hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                            transition duration-150 flex items-center gap-2 whitespace-nowrap"
                        >
                          <FontAwesomeIcon icon={isLoading ? faSpinner : faCheck} 
                            className={isLoading ? 'animate-spin' : ''} />
                          {isLoading ? '儲存中' : '儲存'}
                        </button>
                        <button
                          onClick={handleCancelChanges}
                          disabled={isLoading}
                          className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg
                            hover:bg-gray-50 transition duration-150 flex items-center gap-2 whitespace-nowrap"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 pl-2">
                      <span className="text-gray-900">{formData.username}</span>
                      <button
                        onClick={() => handleEditClick('username')}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-full
                          hover:bg-blue-50 transition duration-150"
                        aria-label="編輯用戶名稱"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    </div>
                  )}
                </div>

                {/* 電子郵件 */}
                <div className="grid grid-cols-[80px_1fr] items-center">
                  <label className="text-sm font-medium text-gray-700">電子郵件：</label>
                  <div className="flex items-center gap-2 pl-2">
                    <span className="text-gray-900">{formData.email}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 
                      text-green-700 text-xs font-medium rounded-full border border-green-200">
                      <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                      已驗證
                    </span>
                  </div>
                </div>

                {/* 註冊日期 */}
                <div className="grid grid-cols-[80px_1fr] items-center">
                  <label className="text-sm font-medium text-gray-700">註冊日期：</label>
                  <span className="text-gray-900 pl-2">
                    {formatDate(profileData.registrationDate)}
                  </span>
                </div>

                {/* 用戶 ID */}
                <div className="grid grid-cols-[80px_1fr] items-center">
                  <label className="text-sm font-medium text-gray-700">用戶 ID：</label>
                  <span className="text-gray-900  pl-2">
                    {user?.sub || '未知'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfileSection;