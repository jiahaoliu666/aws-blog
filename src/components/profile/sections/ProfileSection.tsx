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
  useEffect(() => {
    const handleAvatarUpdate = (event: CustomEvent) => {
      if (setFormData) {
        setFormData((prev: any) => ({
          ...prev,
          avatar: event.detail
        }));
      }
    };

    window.addEventListener('avatarUpdate', handleAvatarUpdate as EventListener);

    return () => {
      window.removeEventListener('avatarUpdate', handleAvatarUpdate as EventListener);
    };
  }, [setFormData]);

  useEffect(() => {
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar && setFormData) {
      setFormData(prev => ({ ...prev, avatar: savedAvatar }));
    }
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 border-b pb-4">個人資訊</h1>

      <div className="space-y-6">
        {/* 頭像上傳 */}
        <div className="flex justify-center">
          <div className="relative">
            <img
              src={tempAvatar || formData.avatar || '/images/default-avatar.png'}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
            />
            <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition duration-200">
              <FontAwesomeIcon icon={faCamera} />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </label>
          </div>
        </div>

        {/* 用戶名稱 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">基本資料</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm text-gray-600">用戶名稱</label>
                <div className="flex items-center space-x-2">
                  {isEditable.username ? (
                    <input
                      type="text"
                      value={localUsername}
                      onChange={(e) => setLocalUsername(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-lg">{formData.username}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  if (isEditable.username) {
                    resetUsername();
                  }
                  toggleEditableField('username');
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                <FontAwesomeIcon icon={isEditable.username ? faTimes : faEdit} />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">電子郵件</label>
              <div className="flex items-center space-x-2">
                <span className="text-lg">{formData.email}</span>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">已驗證</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">註冊日期</label>
              <div className="text-lg">{formData.registrationDate}</div>
            </div>
          </div>
        </div>

        {/* 上傳訊息 */}
        {uploadMessage && (
          <div className={`p-4 rounded-lg ${
            uploadMessage.includes('成功') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {uploadMessage}
          </div>
        )}

        {/* 操作按鈕 */}
        {isEditable.username && (
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleCancelChanges}
              className="px-4 py-2 bg-gray-200 rounded-full hover:bg-gray-300 transition duration-200"
              disabled={isLoading}
            >
              取消
            </button>
            <button
              onClick={() => handleSaveProfileChanges(localUsername)}
              className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition duration-200 flex items-center"
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
  );
};

export default ProfileSection;