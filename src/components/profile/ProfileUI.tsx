import React, { useState, useEffect } from 'react';
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
  setIsPasswordModalOpen: (value: boolean) => void;
  setShowOldPassword: (value: boolean) => void;
  setShowNewPassword: (value: boolean) => void;
  handleSaveProfileChanges: (localUsername: string) => void;
  handleChangePassword: () => void;
  handleLogout: () => void;
  handleAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleEditClick: () => void;
  handleOpenPasswordModal: () => void;
  handleClosePasswordModal: () => void;
  handleCancelChanges: () => void;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setIsEditable: (value: any) => void; // 根據需要替換 'any' 為更具體的類型
  resetPasswordFields: () => void; // 新增這個 prop
  toggleEditableField: (field: keyof EditableFields) => void; // 確保這個 prop 被傳遞
  activityLog: { date: string; action: string; }[]; // 移除 details
  setActivityLog: (value: { date: string; action: string; }[]) => void; // 移除 details
  oldPassword: string; // 確保這行存在
  setOldPassword: (value: string) => void;
};

// 定義 isEditable 的類型
type EditableFields = {
  username: boolean;
  password: boolean;
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
  setIsPasswordModalOpen,
  setShowOldPassword,
  setShowNewPassword,
  handleSaveProfileChanges,
  handleChangePassword,
  handleLogout,
  handleAvatarChange,
  handleEditClick,
  handleOpenPasswordModal,
  handleClosePasswordModal,
  handleCancelChanges,
  handleChange,
  setIsEditable,
  resetPasswordFields,
  toggleEditableField,
  activityLog,
  setActivityLog,
  oldPassword, // 確保這行存在
  setOldPassword,
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [localUploadMessage, setLocalUploadMessage] = useState(uploadMessage);
  const [localUsername, setLocalUsername] = useState(formData.username);
  // 移除本地的 oldPassword 狀態
  // const [oldPassword, setOldPassword] = useState(''); // 移除這行

  useEffect(() => {
    setLocalUploadMessage(uploadMessage);
    const timer = setTimeout(() => {
      setLocalUploadMessage('');
    }, 5000);

    return () => clearTimeout(timer);
  }, [uploadMessage, formData.avatar]);

  useEffect(() => {
    setLocalUsername(formData.username);
  }, [formData.username]);

  useEffect(() => {
    const fetchActivityLog = async () => {
      try {
        const response = await fetch('/api/profile/activity-log?userId=' + user?.sub);
        const data = await response.json();
        setActivityLog(data);
      } catch (error) {
        console.error('Error fetching activity log:', error);
      }
    };

    fetchActivityLog();
  }, [user, uploadMessage]);

  return (
    <div className="container mx-auto flex-grow p-5 flex flex-col md:flex-row gap-y-6 md:gap-x-6">
      {!user ? (
        <div className="flex-grow flex flex-col justify-center items-center mt-10 p-6">
          <Loader className="mb-4" size="large" />
          <h2 className="text-2xl font-semibold text-red-600">請先登入!</h2>
          <p className="text-lg text-gray-700">您將被重新導向至登入頁面...</p>
        </div>
      ) : (
        <>
          <div className="w-full md:w-1/4 bg-gray-500 p-6 rounded-lg shadow-lg mb-6 md:mb-0">
            <div className="flex flex-col items-center mb-8">
              <img
                src={formData.avatar}
                alt="用戶頭像"
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg mb-3"
              />
              <p className="text-xl font-semibold text-white">{formData.username}</p>
              <p className="text-sm text-gray-300">{formData.email}</p>
            </div>
            <ul className="space-y-3">
              {['profile', 'activity', 'changePassword', 'notificationSettings', 'activityLog' , 'feedback' , 'settings'].map((tab) => (
                <li
                  key={tab}
                  className={`p-3 cursor-pointer rounded-lg transition-colors duration-300 text-xl leading-relaxed ${
                    activeTab === tab ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'profile' && '個人資訊'}
                  {tab === 'activity' && '觀看紀錄'}
                  {tab === 'settings' && '帳戶設定'}
                  {tab === 'changePassword' && '修改密碼'}
                  {tab === 'feedback' && '用戶反饋'}
                  {tab === 'activityLog' && '活動日誌'}
                  {tab === 'notificationSettings' && '通知設置'}
                  {tab === 'edit' && '編輯'}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full md:w-3/4 p-4 bg-gray-10 border border-gray-600 rounded-lg shadow-lg shadow-gray-400">
            <div className="text-gray-800">
              {activeTab === 'profile' && (
                <div>
                  <h1 className="text-4xl font-bold mb-4">個人資訊</h1>
                  <div className="flex flex-col md:flex-row items-center mb-2">
                    <div className="flex flex-col items-center">
                      <img
                        src={formData.avatar} // 保這裡使用最新的 formData.avatar
                        alt="用戶頭像"
                        className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg mb-2"
                      />
                      <button
                        onClick={() => document.getElementById('avatar')?.click()}
                        className="mt-2 bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition duration-200 mb-4"
                      >
                        更換頭像
                      </button>
                    </div>
                    <div className="text-center md:text-left md:ml-6 -mt-16">
                      <p className="text-xl mb-2">用戶名：{formData.username}</p>
                      <p className="text-xl mb-2">電子郵件：{formData.email}</p>
                      <p className="text-xl">註冊日期：{formData.registrationDate}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <input
                        type="file"
                        id="avatar"
                        name="avatar"
                        onChange={handleAvatarChange}
                        className="hidden" // 隱藏 input
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">用戶名</label>
                      <input
                        id="name"
                        name="username"
                        value={localUsername} // 使用 localUsername
                        onChange={(e) => setLocalUsername(e.target.value)} // 更新 localUsername
                        className="mt-2 p-2 border border-gray-300 rounded w-full"
                        disabled={!isEditable.username}
                      />
                    </div>
                    <div className="pt-0">
                      <div className="flex items-center mt-2">
                        <SwitchField
                          label="編輯用戶名"
                          isChecked={isEditable.username}
                          onChange={() => toggleEditableField('username')}
                          className="mr-2"
                        />
                      </div>
                    </div>
                  </div>

                  {localUploadMessage && (
                    <div className={`mt-4 mb-6 p-4 rounded-lg shadow-md ${localUploadMessage.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {localUploadMessage}
                    </div>
                  )}

                  <div className="profile-actions mt-6 flex flex-col md:flex-row justify-end space-y-4 md:space-y-0 md:space-x-4">
                    <button 
                      onClick={() => {
                        handleCancelChanges();
                        setLocalUsername(formData.username); // 重置 localUsername
                      }} 
                      className="bg-gray-300 py-2 px-4 rounded-full hover:bg-gray-400 transition duration-200"
                    >
                      取消更改
                    </button>
                    <button onClick={() => handleSaveProfileChanges(localUsername)} className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition duration-200">
                      保存更改
                    </button>
                  </div>
                </div>
              )}
              {activeTab === 'activity' && (
                <>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">最近的觀看紀錄</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {recentArticles.length === 0 ? (
                      <p className="text-gray-500">目前沒有任何觀看紀錄。</p>
                    ) : (
                      recentArticles.map((article, index) => (
                        <div
                          key={index}
                          className="border border-gray-300 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300"
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
                </>
              )}
              {activeTab === 'settings' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">設定</h3>
                  {/* 這裡可以放其他設定內 */}
                </div>
              )}
              {activeTab === 'changePassword' && (
                <>
                  <h2 className="text-2xl font-bold mb-6 text-center">修改密碼</h2>
                  <div className="space-y-4">
                    <div className="mb-4 relative">
                      <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      <input
                        id="oldPassword"
                        name="oldPassword"
                        type={showOldPassword ? "text" : "password"}
                        placeholder="輸入舊密碼"
                        value={oldPassword} // 確保這裡使用 oldPassword
                        onChange={(e) => setOldPassword(e.target.value)} // 更新 oldPassword
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
                        name="password"
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
                    <div className="mb-4 relative">
                      <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      <input
                        id="confirmNewPassword"
                        name="confirmPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="再次輸入新密碼"
                        value={formData.confirmPassword}
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
                    <button 
                      onClick={() => {
                        handleClosePasswordModal(); // 調用此函數以重置密碼欄位
                        resetPasswordFields(); // 確保這行被調用以重置密碼欄位
                      }} 
                      className="bg-gray-300 py-2 px-4 rounded-full hover:bg-gray-400 transition duration-200"
                    >
                      取消更改
                    </button>
                    <button onClick={handleChangePassword} className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition duration-200" disabled={isLoading}>
                      {isLoading ? '保存中...' : '保存更改'}
                    </button>
                  </div>
                </>
              )}
              {activeTab === 'feedback' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">用戶反饋</h3>
                  <form className="space-y-4">
                    <div>
                      <label htmlFor="feedbackEmail" className="block text-sm font-medium text-gray-700">電子郵件</label>
                      <input
                        id="feedbackEmail"
                        name="feedbackEmail"
                        type="email"
                        value={formData.email} // 使用 formData.email 作為默認值
                        className="mt-2 p-2 border border-gray-300 rounded w-full"
                        placeholder="輸入您的電子郵件"
                        disabled // 設置為不可編輯
                      />
                    </div>
                    <div>
                      <label htmlFor="feedbackTitle" className="block text-sm font-medium text-gray-700">標題</label>
                      <input
                        id="feedbackTitle"
                        name="feedbackTitle"
                        type="text"
                        className="mt-2 p-2 border border-gray-300 rounded w-full"
                        placeholder="輸入標題"
                      />
                    </div>
                    <div>
                      <label htmlFor="feedbackContent" className="block text-sm font-medium text-gray-700">反饋內容</label>
                      <textarea
                        id="feedbackContent"
                        name="feedbackContent"
                        rows={4}
                        className="mt-2 p-2 border border-gray-300 rounded w-full"
                        placeholder="請輸入您的問題、意見或建議"
                      />
                    </div>
                    <div>
                      <label htmlFor="feedbackImage" className="block text-sm font-medium text-gray-700">上傳圖片</label>
                      <input
                        id="feedbackImage"
                        name="feedbackImage"
                        type="file"
                        accept="image/*"
                        className="mt-2 p-2 border border-gray-300 rounded w-full"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition duration-200"
                      >
                        提交反饋
                      </button>
                    </div>
                  </form>
                </div>
              )}
              {activeTab === 'activityLog' && (
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">活動日誌</h3>
                  <div className="space-y-4">
                    {activityLog.length === 0 ? (
                      <p className="text-gray-500">目前沒有任何活動日誌。</p> // 新增這行
                    ) : (
                      activityLog.slice(0, 6).map((log, index) => (
                        <div key={index} className="bg-gray-100 p-4 rounded-lg shadow-lg border-2 border-gray-300">
                          <p className="text-sm text-gray-500">{log.date}</p>
                          <h4 className="text-lg font-semibold mt-2">{log.action}</h4>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'notificationSettings' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">通知設置</h3>
                  {/* 在這裡添加通知設置內容 */}
                </div>
              )}
            </div>
          </div>
        </>
      )
    }
    </div>
  );
};

export default ProfileUI;
function setIsEditable(arg0: (prevState: EditableFields) => { username: boolean; password: boolean; }) {
  throw new Error('Function not implemented.');
}

















