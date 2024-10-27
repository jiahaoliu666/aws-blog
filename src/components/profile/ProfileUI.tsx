import React, { useState, useEffect } from 'react';
import { Loader } from '@aws-amplify/ui-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { SwitchField } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useProfileLogic } from '../../hooks/profile/useProfileLogic';
import Navbar from '../common/Navbar'; 
import Footer from '../common/Footer'; 

const ProfileUI: React.FC = () => {
  const {
    user,
    formData,
    recentArticles,
    isEditing,
    isPasswordModalOpen,
    showOldPassword,
    showNewPassword,
    isLoading,
    isEditable,
    setIsEditing,
    setTempAvatar,
    setFormData,
    setOldPassword,
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
    resetPasswordFields,
    toggleEditableField,
    activityLog,
    oldPassword,
    calculatePasswordStrength,
    resetFeedbackForm,
    initializeTabState,
    localUsername,
    setLocalUsername,
    resetUsername,
    uploadMessage, // 確保這些狀態直接從 useProfileLogic 中獲取
    passwordMessage,
    logRecentArticle, // 確保這些狀態直接從 useProfileLogic 中獲取
  } = useProfileLogic();

  const [activeTab, setActiveTab] = React.useState('profile');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const [isCompactLayout, setIsCompactLayout] = React.useState(false);

  React.useEffect(() => {
    initializeTabState();
  }, [activeTab]);

  React.useEffect(() => {
    console.log('Password message updated:', passwordMessage);
  }, [passwordMessage]);

  React.useEffect(() => {
    console.log('Upload message updated:', uploadMessage);
  }, [uploadMessage]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow container mx-auto p-4 flex flex-col lg:flex-row gap-4 overflow-y-auto">
        {!user ? (
          <div className="flex-grow flex flex-col justify-center items-center mt-10 p-6">
            <Loader className="mb-4" size="large" />
            <h2 className="text-2xl font-semibold text-red-600">請先登入!</h2>
            <p className="text-lg text-gray-700">您將被重新導向至登入頁面...</p>
          </div>
        ) : (
          <>
            <div className="w-full lg:w-1/4 bg-gray-700 p-4 rounded-lg shadow-lg mb-4 lg:mb-0">
              <div className="flex flex-col items-center mb-4">
                <img
                  src={formData.avatar}
                  alt="用戶頭像"
                  className="w-24 h-24 rounded-full border-4 border-blue-500 shadow-lg mb-2"
                />
                <p className="text-white text-lg">{formData.username}</p>
                <p className="text-gray-300 text-sm">{formData.email}</p>
              </div>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="text-white hover:text-gray-400 transition duration-300 flex items-center text-lg lg:hidden"
              >
                個人資訊選單
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <ul className={`space-y-3 ${isProfileMenuOpen ? 'block' : 'hidden'} lg:block`}>
                {['profile', 'activity', 'changePassword', 'notificationSettings', 'activityLog', 'feedback', 'settings'].map((tab) => (
                  <li
                    key={tab}
                    className={`p-3 cursor-pointer rounded-lg transition-colors duration-300 text-xl leading-relaxed ${
                      activeTab === tab ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'profile' && '個人資訊'}
                    {tab === 'activity' && '觀看紀錄'}
                    {tab === 'settings' && '帳戶設定'}
                    {tab === 'changePassword' && '修改密碼'}
                    {tab === 'feedback' && '意見反饋'}
                    {tab === 'activityLog' && '活動日誌'}
                    {tab === 'notificationSettings' && '通知設置'}
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-full lg:w-3/4 p-3 bg-white border border-gray-300 rounded-lg shadow-lg flex-grow mt-0">
              <div className="text-gray-800 ">
                {activeTab === 'profile' && (
                  <div>
                    <h1 className="text-4xl font-bold mb-4">個人資訊</h1>
                    <div className="flex flex-col md:flex-row items-center mb-2">
                      <div className="flex flex-col items-center">
                        <img
                          src={formData.avatar}
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
                      <div className="text-center md:text-left md:ml-6 -mt-14">
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
                          className="hidden"
                        />
                      </div>
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">用戶名</label>
                        <input
                          id="name"
                          name="username"
                          value={localUsername}
                          onChange={(e) => setLocalUsername(e.target.value)}
                          className="mt-2 p-2 border border-gray-300 rounded w-full"
                          disabled={!isEditable.username}
                        />
                      </div>
                      <div className="pt-0">
                        <div className="flex items-center mt-2">
                          <SwitchField
                            label="編輯用戶名"
                            isChecked={isEditable.username}
                            onChange={() => {
                              toggleEditableField('username');
                              if (isEditable.username) {
                                resetUsername(); // 當開關關閉時用戶名
                              }
                            }}
                            className="mr-2"
                          />
                        </div>
                      </div>
                    </div>

                    {uploadMessage && (
                      <div className={`mt-4 mb-6 p-4 rounded-lg shadow-md ${uploadMessage.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {uploadMessage}
                      </div>
                    )}

                    <div className="profile-actions mt-6 flex flex-col md:flex-row justify-end space-y-4 md:space-y-0 md:space-x-4">
                      <button 
                        onClick={() => {
                          handleCancelChanges();
                          setLocalUsername(formData.username);
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
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-2xl font-bold text-gray-800">最近的觀看紀錄</h3>
                      <button
                        onClick={() => setIsCompactLayout(!isCompactLayout)}
                        className="bg-blue-600 text-white py-1 px-3 rounded-full hover:bg-blue-700 transition duration-200 hidden md:block"
                      >
                        切換佈局
                      </button>
                    </div>
                    <div className={`grid ${isCompactLayout ? 'grid-cols-1 gap-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
                      {recentArticles.length === 0 ? (
                        <div className="flex flex-col">
                          <p className="text-lg text-gray-500 text-left">目前沒有任何觀看紀錄。</p>
                        </div>
                      ) : (
                        recentArticles.map((article, index) => (
                          <div
                            key={index}
                            className={`border border-gray-300 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-300`}
                          >
                            <div className="flex flex-col gap-2">
                              <span className="text-sm text-gray-600">
                                {new Date(article.timestamp).toLocaleString()}
                              </span>
                              <a
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-base text-blue-600 hover:underline"
                              >
                                {index + 1}. [{article.sourcePage}] {article.translatedTitle}
                              </a>
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
                  </div>
                )}
                {activeTab === 'changePassword' && (
                  <>
                    <h2 className="text-2xl font-bold mb-6 text-center">修改密碼</h2>
                    
                    <div className="mb-4 relative">
                      <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                      <input
                        id="oldPassword"
                        name="oldPassword"
                        type={showOldPassword ? "text" : "password"}
                        placeholder="輸入舊密碼"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
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
                    <div className="space-y-4">
                      {/* 密碼強度 */}
                      <div className="mb-4 mt-6">
                        <label className="block text-sm font-medium text-gray-700">密碼強度</label>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${calculatePasswordStrength(formData.password) * 20}%` }}
                          ></div>
                        </div>
                        <p className="mt-4 text-sm text-gray-500">使用大小寫字母、數字、特殊字符來增強密碼安性</p>
                      </div>

                      {/* 雙重認證 */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">雙重認證</label>
                        <div className="flex items-center mt-2">
                          <span className="mr-2">啟用雙重認證</span>
                          <SwitchField
                            label=""
                            isChecked={false}
                            onChange={() => {}}
                            className="mr-2"
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">啟用後，每次登錄都需要輸入證碼</p>
                      </div>

                      {/* 安全提示 */}
                      <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700">安全提示</h4>
                        <p className="mt-2 text-sm text-gray-500">
                          定期更改密碼並避免在多個網站使用相同的密碼，可以大大提高帳戶安全性。
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-4 mt-6">
                      <button 
                        onClick={() => {
                          handleClosePasswordModal();
                          resetPasswordFields();
                        }} 
                        className="bg-gray-300 py-2 px-4 rounded-full hover:bg-gray-400 transition duration-200"
                      >
                        取消更改
                      </button>
                      <button onClick={handleChangePassword} className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition duration-200" disabled={isLoading}>
                        {isLoading ? '保存...' : '更改密碼'}
                      </button>
                    </div>
                    {passwordMessage && (
                      <div className={`mt-4 mb-6 p-4 rounded-lg shadow-md ${passwordMessage.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {passwordMessage}
                      </div>
                    )}
                  </>
                )}
                {activeTab === 'feedback' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">意見反饋</h3>
                    <form className="space-y-4">
                      <div>
                        <label htmlFor="feedbackEmail" className="block text-sm font-medium text-gray-700">電子</label>
                        <input
                          id="feedbackEmail"
                          name="feedbackEmail"
                          type="email"
                          value={formData.email}
                          className="mt-2 p-2 border border-gray-300 rounded w-full"
                          placeholder="輸入您電子郵"
                          disabled
                        />
                      </div>
                      <div>
                        <label htmlFor="feedbackTitle" className="block text-sm font-medium text-gray-700">標題</label>
                        <input
                          id="feedbackTitle"
                          name="feedbackTitle"
                          type="text"
                          value={formData.feedbackTitle}
                          onChange={handleChange}
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
                          value={formData.feedbackContent}
                          onChange={handleChange}
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
                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={resetFeedbackForm}
                          className="bg-gray-300 py-2 px-4 rounded-full hover:bg-gray-400 transition duration-200"
                        >
                          取消提交
                        </button>
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
                        <p className="text-gray-500">目前沒有任何活動日誌。</p>
                      ) : (
                        activityLog.slice(0, 12).map((log, index) => (
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
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ProfileUI;
