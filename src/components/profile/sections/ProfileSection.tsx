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
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const { showToast } = useToastContext();

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

  const handleSave = async () => {
    try {
      await handleSaveProfileChanges(localUsername);
    } catch (error) {
      showToast('儲存失敗', 'error');
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">個人資訊</h1>
        <p className="mt-2 text-gray-600">管理您的個人資料與帳號設定</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* 頭像區塊 */}
        <div className="p-8 border-b border-gray-100">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <div className="relative w-40 h-40 rounded-full overflow-hidden ring-4 ring-gray-50">
                <img
                  src={currentAvatar || '/images/default-avatar.png'}
                  alt="個人頭像"
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 
                  transition-all duration-300 flex items-center justify-center">
                  <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 
                    transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    更換頭像
                  </span>
                </div>
              </div>
              
              <label className="absolute bottom-2 right-2 flex items-center justify-center w-10 h-10 
                bg-white/90 backdrop-blur-sm rounded-full shadow-lg cursor-pointer
                hover:bg-blue-50 hover:scale-110 active:scale-95
                ring-2 ring-white/50 hover:ring-blue-200
                transform transition-all duration-200 ease-out
                disabled:opacity-50 disabled:cursor-not-allowed
                group">
                <FontAwesomeIcon 
                  icon={isLoading ? faSpinner : faCamera} 
                  className={`text-blue-600 text-lg group-hover:text-blue-700
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
            
            {/* 個人資料表單 */}
            <div className="flex-1">
              <div className="space-y-6">
                {/* 用戶名稱 */}
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-lg font-semibold text-gray-800">用戶名稱：</label>
                    {isEditable.username ? (
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={localUsername}
                          onChange={(e) => setLocalUsername(e.target.value)}
                          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                            transition duration-150 text-lg"
                          disabled={isLoading}
                        />
                        <button
                          onClick={handleSave}
                          disabled={isLoading || !localUsername.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg 
                            hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                            transition duration-150"
                        >
                          {isLoading ? (
                            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                          ) : (
                            <FontAwesomeIcon icon={faCheck} className="mr-2" />
                          )}
                          {isLoading ? '儲存中...' : '儲存'}
                        </button>
                        <button
                          onClick={handleCancelChanges}
                          disabled={isLoading}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg
                            hover:bg-gray-200 transition duration-150"
                        >
                          <FontAwesomeIcon icon={faTimes} className="mr-2" />
                          取消
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-lg text-gray-900">{formData.username}</span>
                        <button
                          onClick={() => handleEditClick('username')}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-full
                            hover:bg-blue-50 transition duration-150"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 電子郵件 */}
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-lg font-semibold text-gray-800">電子郵件：</label>
                    <span className="text-lg text-gray-900">{formData.email}</span>
                    <span className="px-2.5 py-1 bg-green-50 text-green-600 text-base font-medium rounded-full">
                      已驗證
                    </span>
                  </div>
                </div>

                {/* 註冊日期 */}
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-lg font-semibold text-gray-800">註冊日期：</label>
                    <span className="text-lg text-gray-900">{formData.registrationDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;