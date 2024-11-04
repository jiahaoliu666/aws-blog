import React, { useState, useEffect } from 'react';
import { Loader } from '@aws-amplify/ui-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUser, faBell, faShieldAlt, faGlobe, faCog, faClock, faCommentDots, faHistory, faEye, faEnvelope, faQuestionCircle, faBolt, faBookmark, faShareAlt, faFile, faTh, faThList, faExclamationCircle, faCheckCircle, faSpinner, faSave, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { SwitchField } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useProfileLogic } from '../../hooks/profile/useProfileLogic';
import Navbar from '../common/Navbar'; 
import Footer from '../common/Footer'; 
import logActivity from '../../pages/api/profile/activity-log';
import { Switch } from '@headlessui/react';  // 或其他 UI 庫的 Switch 組件
import { checkLineFollowStatus } from '../../services/lineService';
import { useAuth } from '../../hooks/useAuth';
import { MouseEvent } from 'react';
import { User } from '../../types/userType';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../context/AuthContext';
import { lineService } from '../../services/lineService';

interface NotificationSettings {
  line: boolean;
  email: boolean;
}

interface ProfileUIProps {
  user: User | null;
}

interface FormData {
  // ... 現有的屬性 ...
  notifications: {
    email: boolean;
    line: boolean;
  };
  showEmailSettings: boolean;
  showLineSettings: boolean;
}

interface VerificationStatus {
  code: string | null;
  message: string;
  status: 'pending' | 'success' | 'error';
}

const ProfileUI: React.FC<ProfileUIProps> = ({ user }) => {
  const {
    activeTab,
    setActiveTab,
    isProfileMenuOpen,
    setIsProfileMenuOpen,
    isCompactLayout,
    setIsCompactLayout,
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
    handleSaveSettings,
    sendFeedback,
    feedbackMessage,
    resetUploadState, // 新增這行
    lineUserId,
    setLineUserId,
    lineIdError,
    lineIdStatus,
    handleLineIdChange,
    settingsMessage,
    settingsStatus,
    toggleNotification, // 確保這行加入
    handleSaveNotificationSettings,
  } = useProfileLogic({ user });

  const router = useRouter();
  const { user: authUser } = useAuthContext();
  const [isClient, setIsClient] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
  }>({ status: null, message: '' });
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    code: null,
    message: '',
    status: 'pending'
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (!authUser && !window.localStorage.getItem("user")) {
      const timer = setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [authUser, router, isClient]);

  // 修改條件渲染
  if (!isClient) {
    return null; // 或顯示載入中的狀態
  }

  const storedUser = typeof window !== 'undefined' ? localStorage.getItem("user") : null;
  if (!user && !storedUser) {
    return (
      <div className="flex-grow flex flex-col justify-center items-center mt-10 p-6">
        <Loader className="mb-4" size="large" />
        <h2 className="text-2xl font-semibold text-red-600">請先登入!</h2>
        <p className="text-lg text-gray-700">您將重新導向至登入頁面...</p>
      </div>
    );
  }

  const verifyLineFollowing = async () => {
    if (!lineUserId.trim()) {
      setVerificationResult({
        status: 'error',
        message: '請先輸入 LINE ID'
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch('/api/line/check-follow-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lineId: lineUserId, userId: authUser?.sub })
      });

      const data = await response.json();
      
      if (data.isFollowing) {
        setVerificationResult({
          status: 'success',
          message: '驗證成功！您已成功追蹤 LINE 官方帳號'
        });
      } else {
        setVerificationResult({
          status: 'error',
          message: '驗證失敗：您尚未追蹤 LINE 官方帳號'
        });
      }
    } catch (error) {
      setVerificationResult({
        status: 'error',
        message: '驗證過程發生錯誤，請稍後再試'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerification = async () => {
    setIsVerifying(true);
    try {
      if (!user?.sub) {
        throw new Error('使用者ID未定義');
      }
      const code = await lineService.generateVerificationCode(user.sub);
      setVerificationStatus({
        code,
        message: '請將驗證碼傳送給官方帳號',
        status: 'pending'
      });
    } catch (error) {
      setVerificationStatus({
        code: null,
        message: '驗證碼產生失敗，請稍後再試',
        status: 'error'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex-grow container mx-auto px-2 sm:px-6 lg:px-8 py-4 lg:py-8 flex flex-col lg:flex-row gap-3 lg:gap-6">
        {!user ? (
          <div className="flex-grow flex flex-col justify-center items-center mt-10 p-6">
            <Loader className="mb-4" size="large" />
            <h2 className="text-2xl font-semibold text-red-600">請先登入!</h2>
            <p className="text-lg text-gray-700">您將重新導向至登入頁面...</p>
          </div>
        ) : (
          <>
            <div className="w-full lg:w-1/4 bg-gray-700 p-3 sm:p-6 rounded-xl shadow-xl mb-3 lg:mb-0 lg:sticky lg:top-4">
              <div className="flex flex-col items-center mb-6 sm:mb-8">
                <img
                  src={formData.avatar}
                  alt="用戶頭像"
                  className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-blue-500 shadow-lg mb-4"
                />
                <p className="text-white text-xl font-semibold">{formData.username}</p>
                <p className="text-gray-300 text-sm mt-1">{formData.email}</p>
              </div>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-full text-white hover:text-gray-200 transition duration-300 flex items-center justify-between p-3 rounded-lg bg-gray-600 lg:hidden mb-4"
              >
                <span className="text-sm sm:text-base">個人訊選</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <ul className={`space-y-2 ${isProfileMenuOpen ? 'block' : 'hidden'} lg:block`}>
                {[
                  { tab: 'profile', label: '個人資訊', icon: faUser },
                  { tab: 'changePassword', label: '修改密碼', icon: faLock },
                  { tab: 'notificationSettings', label: '通知設定', icon: faBell },
                  { tab: 'settings', label: '偏好設定', icon: faCog }, 
                  { tab: 'activity', label: '觀看紀錄', icon: faEye },
                  { tab: 'feedback', label: '意見反饋', icon: faCommentDots },
                  { tab: 'activityLog', label: '活動日誌', icon: faClock },
                ].map(({ tab, label, icon }) => (
                  <li
                    key={tab}
                    className={`p-3 cursor-pointer rounded-lg transition-colors duration-300 text-xl leading-relaxed ${
                      activeTab === tab ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    <FontAwesomeIcon icon={icon} className="mr-3" /> {/* 調整間距 */}
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-full lg:w-3/4 bg-white border border-gray-200 rounded-xl shadow-xl p-3 sm:p-6">
              <div className="text-gray-800 ">
                {activeTab === 'profile' && (
                  <div className="space-y-8">
                    <h1 className="text-3xl font-bold text-gray-800 border-b pb-4">個人資訊</h1>
                    <div className="flex flex-col md:flex-row items-start gap-8">
                      <div className="flex flex-col items-center space-y-4">
                        <img
                          src={formData.avatar}
                          alt="用戶頭像"
                          className="w-40 h-40 rounded-full border-4 border-blue-500 shadow-xl"
                        />
                        <button
                          onClick={() => document.getElementById('avatar')?.click()}
                          className="bg-blue-600 text-white py-2.5 px-6 rounded-full hover:bg-blue-700 transition duration-200 shadow-md"
                        >
                          更換頭像
                        </button>
                      </div>
                      <div className="flex-grow space-y-4">
                        <div>
                          <p className="text-xl mb-2">用戶名：{formData.username}</p>
                          <p className="text-xl mb-2">電子郵件：{formData.email}</p>
                          <p className="text-xl">註冊日期：{formData.registrationDate}</p>
                        </div>
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
                                  resetUsername(); // 開關關閉時用戶名
                                }
                              }}
                              className="mr-2"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      {uploadMessage && (
                        <div className={`mb-4 p-4 rounded-lg shadow-md ${
                          uploadMessage.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {uploadMessage}
                        </div>
                      )}
                      <div className="flex justify-end gap-4">
                        <button 
                          onClick={() => {
                            handleCancelChanges();
                            setLocalUsername(formData.username);
                          }} 
                          className="bg-gray-300 py-2 px-4 rounded-full hover:bg-gray-400 transition duration-200"
                        >
                          取消更改
                        </button>
                        <button 
                          onClick={() => handleSaveProfileChanges(localUsername)} 
                          className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition duration-200"
                        >
                          保存更改
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'activity' && (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-2xl font-bold text-gray-800">最的觀看紀錄</h3>
                      <button
                        onClick={() => setIsCompactLayout(!isCompactLayout)}
                        className="bg-blue-600 text-white py-2 px-3 rounded-full hover:bg-blue-700 transition duration-200 flex items-center"
                      >
                        <FontAwesomeIcon icon={isCompactLayout ? faTh : faThList} size="lg" className="mr-2" />
                        {isCompactLayout ? '網格佈局' : '列表佈局'}
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
                    <h3 className="text-xl font-bold text-gray-800 mb-4">偏好設定</h3>
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
                      <div className="mb-8 mt-8">
                        <label className="block text-sm font-medium text-gray-700">密碼強度</label>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${calculatePasswordStrength(formData.password) * 20}%` }}
                          ></div>
                        </div>
                        <p className="mt-4 text-sm text-gray-500">用大小寫字母、、特殊字符來增強密碼安性</p>
                      </div>
                      {/* 安全 */}
                      <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700">安全提示</h4>
                        <p className="mt-2 text-sm text-gray-500">
                          定期更改密碼並免在多個網站使用同的密碼，可以大大提高帳戶安全性。
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
                        消更改
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
                    <form className="space-y-4" onSubmit={(e) => {
                      e.preventDefault();
                      sendFeedback(() => {
                        const feedbackImageInput = document.getElementById('feedbackImage1') as HTMLInputElement;
                        if (feedbackImageInput) {
                          feedbackImageInput.value = '';
                        }
                      });
                    }}>
                      <div>
                        <label htmlFor="feedbackEmail" className="block text-sm font-medium text-gray-700">電子郵件</label>
                        <input
                          id="feedbackEmail"
                          name="feedbackEmail"
                          type="email"
                          value={formData.email}
                          className="mt-2 p-2 border border-gray-300 rounded w-full"
                          placeholder="入您的電子郵件"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">傳圖片</label>
                      <input
                        id="feedbackImage1"
                        name="feedbackImage1"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const files = e.target?.files;
                          if (files && files[0]) {
                            setFormData(prevData => ({ ...prevData, feedbackImage: files[0] }));
                          }
                        }}
                        className="mt-2 p-2 border border-gray-300 rounded w-full"
                      />
                      {feedbackMessage && (
                        <div className={`mt-4 mb-6 p-4 rounded-lg shadow-md ${feedbackMessage.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {feedbackMessage}
                        </div>
                      )}
                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => {
                            resetFeedbackForm(); // 重置反饋表單
                            resetUploadState(); // 重置上傳狀態
                            const feedbackImageInput = document.getElementById('feedbackImage1') as HTMLInputElement;
                            if (feedbackImageInput) {
                              feedbackImageInput.value = ''; // 清空選擇的檔案
                            }
                          }}
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
                  <>
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">通知設定</h3>
                    <div className="space-y-6">
                      {/* Email 通知設定 */}
                      <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 p-3 rounded-full">
                              <FontAwesomeIcon icon={faEnvelope} className="text-blue-600 text-xl" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-800">Email 通知</h4>
                              <p className="text-sm text-gray-500">接收最新文章的 Email 通知</p>
                            </div>
                          </div>
                          <SwitchField
                            label=""
                            isChecked={formData.notifications.email}
                            onChange={() => toggleNotification('email')}
                          />
                        </div>

                        {/* Email 設定展開內容 */}
                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          formData.notifications.email ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600">通知接收信箱：</span>
                            </div>
                            <div className="mt-2 p-2 bg-gray-100 rounded">
                              <p className="text-gray-800 font-medium">{formData.email}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* LINE 通知設定 */}
                      <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="bg-green-100 p-3 rounded-full">
                              <FontAwesomeIcon icon={faCommentDots} className="text-green-600 text-xl" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-800">Line 通知</h4>
                              <p className="text-sm text-gray-500">接收最新文章的 LINE 即時通知</p>
                            </div>
                          </div>
                          <SwitchField
                            label=""
                            isChecked={formData.notifications.line}
                            onChange={() => toggleNotification('line')}
                          />
                        </div>

                        {/* LINE 設定內容 - 使用動畫過渡 */}
                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          formData.showLineSettings ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                        }`}>
                          {/* 原有的 LINE 設定內容 */}
                          <div className="mb-8 bg-blue-50 p-4 rounded-lg">
                            <h5 className="font-semibold text-blue-800 mb-3">
                              <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                              設定步驟
                            </h5>
                            <ol className="list-decimal list-inside space-y-2 text-blue-700">
                              <li>開啟上方的 LINE 通知開關</li>
                              <li>掃描下方 QR Code 或點擊追蹤按鈕，加入官方帳號好友</li>
                              <li>在下方輸入您的 LINE ID</li>
                              <li>點擊儲存設定完成設置</li>
                            </ol>
                          </div>
                          
                          {/* QR Code 和追蹤按鈕區域 */}
                          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8 p-6 bg-gray-50 rounded-lg">
                            {/* QR Code */}
                            <div className="text-center">
                              <img 
                                src="/line.png" 
                                alt="LINE 官方帳號 QR Code" 
                                className="w-40 h-40 mb-2"
                              />
                              <p className="text-sm text-gray-600">掃 QR Code 加入好友</p>
                            </div>

                            {/* 直接追蹤按鈕 */}
                            <div className="text-center">
                              <a 
                                href="https://line.me/R/ti/p/@601feiwz"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-6 py-3 bg-[#00B900] text-white rounded-lg hover:bg-[#00A000] transition-colors duration-200"
                              >
                                <FontAwesomeIcon icon={faCommentDots} className="mr-2" />
                                點擊加入好友
                              </a>
                              <p className="text-sm text-gray-600 mt-2">或直接點擊按鈕加入</p>
                            </div>

                            {/* 新增：驗證按鈕區塊 */}
                            <div className="text-center">
                              <button
                                onClick={handleVerification}
                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                disabled={isVerifying}
                              >
                                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                                {isVerifying ? '驗證中...' : '開始驗證'}
                              </button>
                              {verificationStatus.code && (
                                <div className="mt-4 p-4 bg-white rounded-lg border shadow-sm">
                                  <p className="font-medium">驗證碼：{verificationStatus.code}</p>
                                  <p className="text-sm text-gray-600 mt-2">
                                    請將此驗證碼傳送給官方帳號
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* LINE ID 輸入區域 */}
                          <div className="mb-6">
                            <label htmlFor="lineUserId" className="block text-sm font-medium text-gray-700 mb-2">
                              LINE ID 設定
                            </label>
                            
                            <div className="relative">
                              <input
                                type="text"
                                id="lineUserId"
                                value={lineUserId}
                                onChange={(e) => handleLineIdChange(e.target.value)}
                                className={`
                                  pl-10 pr-4 py-2 w-full rounded-lg border
                                  ${lineIdStatus === 'success' ? 'border-green-500' : 
                                    lineIdStatus === 'error' ? 'border-red-500' : 'border-gray-300'}
                                `}
                                placeholder="請輸入您的 LINE ID"
                              />
                              
                              {/* 狀態圖示 */}
                              {lineIdStatus === 'validating' && (
                                <FontAwesomeIcon 
                                  icon={faSpinner} 
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" 
                                />
                              )}
                              {lineIdStatus === 'success' && (
                                <FontAwesomeIcon 
                                  icon={faCheckCircle} 
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" 
                                />
                              )}
                              {lineIdStatus === 'error' && (
                                <FontAwesomeIcon 
                                  icon={faExclamationCircle} 
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" 
                                />
                              )}
                            </div>

                            {/* 錯誤訊息 */}
                            {lineIdError && (
                              <p className="mt-2 text-sm text-red-600">{lineIdError}</p>
                            )}

                            {/* 驗證成功訊息 */}
                            {lineIdStatus === 'success' && (
                              <p className="mt-2 text-sm text-green-600">
                                LINE 帳號驗證成功！您將可以收到最新文章通知。
                              </p>
                            )}
                          </div>

                          {/* 追蹤狀態指示 */}
                          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                lineIdStatus === 'success' ? 'bg-green-500' : 
                                lineIdStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
                              }`}></div>
                              <span className="text-sm font-medium text-gray-700">
                                追蹤狀態：
                                {lineIdStatus === 'success' ? '已追蹤' : 
                                 lineIdStatus === 'error' ? '未追蹤' : 
                                 lineUserId ? '驗證中' : '未設定'}
                              </span>
                            </div>
                          </div>

                          {/* 問題排解指南 */}
                          <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
                            <h5 className="font-semibold text-yellow-800 mb-3 flex items-center">
                              <FontAwesomeIcon icon={faQuestionCircle} className="mr-2" />
                              常見問題排解
                            </h5>
                            <div className="space-y-3 text-yellow-700">
                              <details className="cursor-pointer">
                                <summary className="font-medium">無法收到通知？</summary>
                                <ul className="mt-2 ml-5 list-disc text-sm space-y-1">
                                  <li>確認是否已追蹤官方帳號且未封鎖</li>
                                  <li>確認輸入的 LINE ID 是否正確</li>
                                  <li>嘗試重新追蹤官方帳號</li>
                                </ul>
                              </details>
                              <details className="cursor-pointer">
                                <summary className="font-medium">LINE ID 格式說明</summary>
                                <ul className="mt-2 ml-5 list-disc text-sm space-y-1">
                                  <li>長度必須在4-20個字元之間</li>
                                  <li>可使用英文字母、數字、底線(_)和點號(.)</li>
                                  <li>不可包含特殊符號或空格</li>
                                </ul>
                              </details>
                              <details className="cursor-pointer">
                                <summary className="font-medium">需要協助？</summary>
                                <p className="mt-2 text-sm">
                                  如果您遇到任何問題，請透過以下方式聯繫我們：
                                  <a href="mailto:support@example.com" className="text-blue-600 hover:underline ml-1">
                                    support@example.com
                                  </a>
                                </p>
                              </details>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 新增：統一的儲存按鈕區域 */}
                      <div className="mt-8 flex flex-col space-y-4">
                        {/* 顯示設定狀態訊息 */}
                        {settingsMessage && (
                          <div className={`p-4 rounded-lg shadow-md ${
                            settingsStatus === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            <div className="flex items-center">
                              <FontAwesomeIcon 
                                icon={settingsStatus === 'success' ? faCheckCircle : faExclamationCircle} 
                                className="mr-2"
                              />
                              {settingsMessage}
                            </div>
                          </div>
                        )}
                        
                        {/* 儲存按鈕 */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleSaveNotificationSettings(user?.sub)}
                            disabled={isLoading || lineIdStatus === 'error'}
                            className={`
                              px-6 py-2.5 rounded-full
                              flex items-center space-x-2
                              ${isLoading || lineIdStatus === 'error'
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}
                              text-white transition duration-200 shadow-md hover:shadow-lg
                            `}
                          >
                            {isLoading ? (
                              <>
                                <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                <span>儲存中...</span>
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faSave} className="mr-2" />
                                <span>儲存設定</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
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