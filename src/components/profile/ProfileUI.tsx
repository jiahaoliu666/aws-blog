import React from 'react';
import { Loader } from '@aws-amplify/ui-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { SwitchField } from '@aws-amplify/ui-react'; 
import '@aws-amplify/ui-react/styles.css';  



type ProfileUIProps = {
  user: any; // 根據需要替換 'any' 為更具體的類型
  formData: any; // 根據需要替換 'any' 為更具體的類型
  recentArticles: any[]; // 根據需要替換 'any' 為更具體的類型
  isEditing: boolean;
  isPasswordModalOpen: boolean;
  showOldPassword: boolean;
  showNewPassword: boolean;
  uploadMessage: string;
  passwordMessage: string;
  isLoading: boolean;
  isEditable: any; // 根據需要替換 'any' 為更具體的類型
  setIsEditing: (value: boolean) => void;
  setTempAvatar: (value: any) => void; // 根據需要替換 'any' 為更具體的類型
  setFormData: (value: any) => void; // 根據需要替換 'any' 為更具體的類型
  setOldPassword: (value: string) => void;
  setIsPasswordModalOpen: (value: boolean) => void;
  setShowOldPassword: (value: boolean) => void;
  setShowNewPassword: (value: boolean) => void;
  handleSaveChanges: () => void;
  handleLogout: () => void;
  handleAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleEditClick: () => void;
  handleOpenPasswordModal: () => void;
  handleClosePasswordModal: () => void;
  handleCancelChanges: () => void;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setIsEditable: (value: any) => void; // 根據需要替換 'any' 為更具體的類型
};

// 定義 isEditable 的類型
type EditableFields = {
  username: boolean;
  // 如果有其他屬性，請在這裡添加
};

const ProfileUI: React.FC<ProfileUIProps> = ({
  user,
  formData,
  recentArticles,
  isEditing,
  isPasswordModalOpen,
  showOldPassword,
  showNewPassword,
  uploadMessage,
  passwordMessage,
  isLoading,
  isEditable,
  setIsEditing,
  setTempAvatar,
  setFormData,
  setOldPassword,
  setIsPasswordModalOpen,
  setShowOldPassword,
  setShowNewPassword,
  handleSaveChanges,
  handleLogout,
  handleAvatarChange,
  handleEditClick,
  handleOpenPasswordModal,
  handleClosePasswordModal,
  handleCancelChanges,
  handleChange,
  setIsEditable,
}) => {
  return (
    <div className="container mx-auto flex-grow p-5">
      {!user && (
        <div className="flex-grow flex flex-col justify-center items-center bg-gray-100 mt-10">
          <Loader className="mb-4" size="large" />
          <h2 className="text-2xl font-semibold text-red-600">請登入!</h2>
          <p className="text-lg text-gray-700">您將被重新導向至登入頁面...</p>
        </div>
      )}
      {user && (
        <div>
          <h1 className="text-4xl font-bold mb-4 text-gray-800">個人資訊</h1>
          <div className="flex flex-col md:flex-row items-center mb-6">
            <img
              src={formData.avatar}
              alt="用戶頭像"
              className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg mr-4"
            />
            <div className="mt-4 md:mt-0">
              <p className="text-xl text-gray-700 mb-2">用戶名：{formData.username}</p>
              <p className="text-xl text-gray-700 mb-2">電子郵件：{formData.email}</p>
              <p className="text-xl text-gray-700">註冊日期：{formData.registrationDate}</p>
            </div>
          </div>
          <div className="activity-log bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">最近的觀看紀錄</h3>
            <div className="grid grid-cols-1 gap-4">
              {recentArticles.length === 0 ? (
                <p className="text-gray-500">目前沒有任何觀看紀錄。</p>
              ) : (
                recentArticles.map((article, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline flex items-center mb-2 sm:mb-0"
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12.293 2.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l8-8zM11 5.414L5.414 11 7 12.586 12.586 7 11 5.414z"></path>
                        </svg>
                        {index + 1}. [{article.sourcePage}] {article.translatedTitle}
                      </a>
                      <span className="text-sm text-gray-500 mt-1 sm:mt-0">
                        {new Date(article.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="profile-actions mt-6 flex flex-col md:flex-row justify-end space-y-4 md:space-y-0 md:space-x-4">
            <button 
              onClick={handleOpenPasswordModal} 
              className="bg-blue-600 text-white py-2 px-6 rounded-full hover:bg-blue-700 transition duration-200 shadow-md w-full md:w-auto"
            >
              修改密碼
            </button>
            <button 
              onClick={handleEditClick} 
              className="bg-blue-600 text-white py-2 px-6 rounded-full hover:bg-blue-700 transition duration-200 shadow-md w-full md:w-auto"
            >
              編輯
            </button>
            <button 
              onClick={handleLogout} 
              className="bg-red-600 text-white py-2 px-6 rounded-full hover:bg-red-700 transition duration-200 shadow-md w-full md:w-auto"
            >
              登出
            </button>
          </div>
          {isEditing && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
              <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">編輯個人資料</h2>
                <hr className="mb-6 mt-6" />
                <div className="space-y-4">
                  <div>
                    <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">更改頭像</label>
                    <input
                      type="file"
                      id="avatar"
                      name="avatar"
                      onChange={handleAvatarChange}
                      className="mt-2 p-2 border border-gray-300 rounded w-full"
                    />
                    {uploadMessage && (
                      <p className={`mt-2 text-sm ${uploadMessage.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
                        {uploadMessage}
                      </p>
                    )}
                  </div>
                  <div className="pt-3">
                    <hr className="mb-6" />
                    <div className="flex items-center mt-2">
                      <SwitchField
                        label="修改用戶名"
                        isChecked={isEditable.username}
                        onChange={() => setIsEditable((prev: EditableFields) => ({ ...prev, username: !prev.username }))}
                        className="mr-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">修改用戶名</label>
                    <input
                      id="name"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="mt-2 p-2 border border-gray-300 rounded w-full"
                      disabled={!isEditable.username}
                    />
                  </div>
                </div>

                {passwordMessage && (
                  <div className={`mt-4 mb-6 p-4 rounded-lg shadow-md ${passwordMessage.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {passwordMessage}
                  </div>
                )}

                <div className="flex justify-end space-x-4 mt-6">
                  <button onClick={handleCancelChanges} className="bg-gray-300 py-2 px-4 rounded-full hover:bg-gray-400 transition duration-200">
                    取消變更
                  </button>
                  <button onClick={handleSaveChanges} className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition duration-200">
                    保存變更
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-center">修改密碼</h2>
            <div className="space-y-4">
              <div className="mb-4 relative">
                <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  id="oldPassword"
                  name="oldPassword"
                  type={showOldPassword ? "text" : "password"}
                  placeholder="輸入舊密碼"
                  value={formData.oldPassword}
                  onChange={handleChange}
                  required
                  className="border border-gray-300 p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full transition duration-150 ease-in-out text-gray-700"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showOldPassword ? "隱藏" : "顯示"}
                </button>
              </div>
              <div className="mb-4 relative">
                <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="輸入新密碼"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="border border-gray-300 p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full transition duration-150 ease-in-out text-gray-700"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showNewPassword ? "隱藏" : "顯示"}
                </button>
              </div>
            </div>
            {passwordMessage && (
              <div className={`mt-4 mb-6 p-4 rounded-lg shadow-md ${passwordMessage.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {passwordMessage}
              </div>
            )}
            <div className="flex justify-end space-x-4 mt-6">
              <button onClick={handleClosePasswordModal} className="bg-gray-300 py-2 px-4 rounded-full hover:bg-gray-400 transition duration-200">
                取消
              </button>
              <button onClick={handleSaveChanges} className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition duration-200" disabled={isLoading}>
                {isLoading ? '保存中...' : '保存變更'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileUI;
