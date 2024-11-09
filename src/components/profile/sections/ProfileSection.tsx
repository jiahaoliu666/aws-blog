import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCamera, 
  faEdit, 
  faCheck, 
  faTimes,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { FormData } from '@/types/profileTypes';

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
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  formData,
  isEditable,
  localUsername,
  setLocalUsername,
  handleAvatarChange,
  toggleEditableField,
  handleSaveProfileChanges,
  handleCancelChanges,
  resetUsername,
  isLoading,
  uploadMessage,
  handleSubmit,
  isSubmitting,
  errorMessage,
  tempAvatar,
  setFormData
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
    };

    window.addEventListener('avatarUpdate', handleAvatarUpdate as EventListener);

    return () => {
      window.removeEventListener('avatarUpdate', handleAvatarUpdate as EventListener);
    };
  }, []);

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-800 border-b pb-4 mb-6">個人資訊</h1>
      <div className="bg-white p-8 lg:p-12 rounded-2xl shadow-md">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* 左側頭像區塊 */}
          <div className="lg:w-1/3">
            <div className="relative group mb-6">
              <div className="relative overflow-hidden rounded-full transform transition-all duration-300 ease-in-out group-hover:scale-[1.02]">
                <img
                  src={currentAvatar || '/images/default-avatar.png'}
                  alt="Profile"
                  className="w-64 h-64 lg:w-72 lg:h-72 rounded-full object-cover border-4 border-gray-200/80 transition-all duration-300 group-hover:border-blue-500 group-hover:shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/default-avatar.png';
                  }}
                />
              </div>
              <label className="absolute bottom-4 right-4 bg-blue-600 text-white p-3.5 rounded-full cursor-pointer 
                hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5
                shadow-lg hover:shadow-xl active:scale-95 
                flex items-center justify-center
                group-hover:bg-blue-700">
                {isLoading ? (
                  <FontAwesomeIcon icon={faSpinner} spin className="text-lg" />
                ) : (
                  <FontAwesomeIcon icon={faCamera} className="text-lg" />
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAvatarChange}
                  disabled={isLoading} 
                />
              </label>
            </div>

            {uploadMessage && (
              <div className={`mt-4 p-4 rounded-lg transition-all duration-300 ${
                uploadMessage.includes('成功') 
                  ? 'bg-green-50 text-green-700 border-l-4 border-green-500' 
                  : 'bg-red-50 text-red-700 border-l-4 border-red-500'
              }`}>
                <p className="text-sm font-medium">{uploadMessage}</p>
              </div>
            )}
          </div>

          {/* 右側資料區塊 */}
          <div className="lg:w-2/3 space-y-8">
            {/* 用戶名稱 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">用戶名稱</label>
              <div className="flex items-center justify-between">
                <div className="flex-grow">
                  {isEditable.username ? (
                    <input
                      type="text"
                      value={localUsername}
                      onChange={(e) => setLocalUsername(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                    />
                  ) : (
                    <span className="text-lg text-gray-800">{formData.username}</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (isEditable.username) {
                      resetUsername();
                    }
                    toggleEditableField('username');
                  }}
                  className="ml-4 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition duration-200"
                >
                  <FontAwesomeIcon icon={isEditable.username ? faTimes : faEdit} />
                </button>
              </div>
            </div>

            {/* 電子郵件 */}
            <div className="space-y-2 pt-4 border-t">
              <label className="text-sm font-medium text-gray-600">電子郵件</label>
              <div className="flex items-center space-x-3">
                <span className="text-lg text-gray-800">{formData.email}</span>
                <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">已驗證</span>
              </div>
            </div>

            {/* 註冊日期 */}
            <div className="space-y-2 pt-4 border-t">
              <label className="text-sm font-medium text-gray-600">註冊日期</label>
              <div className="text-lg text-gray-800">{formData.registrationDate}</div>
            </div>

            {/* 操作按鈕 */}
            {isEditable.username && (
              <div className="flex justify-end space-x-4 pt-6 mt-6 border-t">
                <button
                  onClick={handleCancelChanges}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200"
                  disabled={isLoading}
                >
                  取消
                </button>
                <button
                  onClick={() => handleSaveProfileChanges(localUsername)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                      儲存中...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="mr-2" />
                      儲存變更
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileSection;