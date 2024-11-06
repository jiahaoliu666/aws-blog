import React, { useState, useEffect } from 'react';
import { Loader } from '@aws-amplify/ui-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUser, faBell, faShieldAlt, faGlobe, faCog, faClock, faCommentDots, faHistory, faEye, faEnvelope, faQuestionCircle, faBolt, faBookmark, faShareAlt, faFile, faTh, faThList, faExclamationCircle, faCheckCircle, faSpinner, faSave, faInfoCircle, faCheck } from '@fortawesome/free-solid-svg-icons';
import { SwitchField } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useProfileLogic } from '../../hooks/profile/useProfileLogic';
import Navbar from '../common/Navbar'; 
import Footer from '../common/Footer'; 
import logActivity from '../../pages/api/profile/activity-log';
import { Switch } from '@headlessui/react';  // 其他 UI 庫的 Switch 組件
import { checkLineFollowStatus } from '../../services/lineService';
import { useAuth } from '../../hooks/useAuth';
import { MouseEvent } from 'react';
import { User } from '../../types/userType';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../context/AuthContext';
import { lineService } from '../../services/lineService';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';
import { TextField } from '@aws-amplify/ui-react';
import { Input } from '@aws-amplify/ui-react';
import { Button } from '@aws-amplify/ui-react';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';

interface NotificationSettings {
  line: boolean;
  email: boolean;
}

interface ProfileUIProps {
  user: User | null;
}

interface FormData {
  username: string;
  email: string;
  registrationDate: string;
  avatar: string;
  notifications: {
    email: boolean;
    line: boolean;
  };
  showEmailSettings: boolean;
  showLineSettings: boolean;
  feedbackImage?: File;
  password?: string;
  confirmPassword?: string;
  feedbackTitle?: string;
  feedbackContent?: string;
}

type VerificationStep = 'idle' | 'verifying' | 'confirming' | 'complete';

interface VerificationStatus {
  code: string | null;
  message: string;
  status: 'idle' | 'pending' | 'success' | 'error' | 'validating' | 'confirming';
}

interface Article {
  timestamp: string;
  link: string;
  sourcePage: string;
  translatedTitle: string;
}

interface ActivityLog {
  date: string;
  action: string;
}

interface VerificationState {
  step: VerificationStep;
  status: 'idle' | 'pending' | 'success' | 'error' | 'validating' | 'confirming';
  message: string;
  isVerified: boolean;
}

// 添加進度指示器樣式
const StepIndicator: React.FC<{ step: VerificationStep }> = ({ step }) => {
  const steps = [
    { key: 'idle', label: '輸入 LINE ID' },
    { key: 'verifying', label: '驗證身份' },
    { key: 'confirming', label: '確認驗證' },
    { key: 'complete', label: '完成綁定' }
  ];

  return (
    <div className="relative mb-8">
      {/* 進度條 */}
      <div className="absolute top-5 w-full h-1 bg-gray-200">
        <div 
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ 
            width: `${(steps.findIndex(s => s.key === step) / (steps.length - 1)) * 100}%` 
          }}
        />
      </div>
      
      {/* 步驟指示器 */}
      <div className="relative flex justify-between">
        {steps.map((s, index) => (
          <div 
            key={s.key}
            className="flex flex-col items-center"
          >
            <div 
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                mb-2 transition-colors duration-300 z-10
                ${step === s.key ? 'bg-blue-500 text-white' : 
                  steps.findIndex(st => st.key === step) > index 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-500'}
              `}
            >
              {steps.findIndex(st => st.key === step) > index ? (
                <FontAwesomeIcon icon={faCheck} />
              ) : (
                index + 1
              )}
            </div>
            <span className="text-sm text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// LINE 通知設定區塊
const LineNotificationSection: React.FC<{
  verificationState: VerificationState;
  lineId: string;
  setLineId: (value: string) => void;
  startVerification: () => void;
  verificationCode: string;
  setVerificationCode: (value: string) => void;
  confirmVerificationCode: (code: string) => void;
  user?: User | null;
}> = ({
  verificationState,
  lineId,
  setLineId,
  startVerification,
  verificationCode,
  setVerificationCode,
  confirmVerificationCode,
  user
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      {/* 標題區塊 */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="bg-green-100 p-3 rounded-full">
          <FontAwesomeIcon icon={faCommentDots} className="text-green-600 text-xl" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">LINE 通知設定</h3>
          <p className="text-sm text-gray-500">
            完成驗證後即可接收最新文章通知
          </p>
        </div>
      </div>

      {/* 進度指示器 */}
      {!verificationState.isVerified && (
        <StepIndicator step={verificationState.step} />
      )}

      {/* 驗證表單 */}
      <div className="space-y-6">
        {/* LINE ID 輸入 */}
        {verificationState.step === 'idle' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LINE ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  placeholder="請輸入您的 LINE ID (以 U 開頭)"
                  className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {lineId && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {/^U[0-9a-f]{32}$/i.test(lineId) ? (
                      <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" />
                    ) : (
                      <FontAwesomeIcon icon={faExclamationCircle} className="text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {lineId && !/^U[0-9a-f]{32}$/i.test(lineId) && (
                <p className="mt-2 text-sm text-red-600">
                  <FontAwesomeIcon icon={faExclamationCircle} className="mr-1" />
                  LINE ID 格式不正確
                </p>
              )}
            </div>
            <button
              onClick={startVerification}
              disabled={!lineId || !/^U[0-9a-f]{32}$/i.test(lineId) || verificationState.status === 'pending'}
              className={`
                w-full py-3 rounded-lg transition-all duration-300
                flex items-center justify-center space-x-2
                ${!lineId || !/^U[0-9a-f]{32}$/i.test(lineId) || verificationState.status === 'pending'
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'}
              `}
            >
              {verificationState.status === 'pending' ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <span>處理中...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheck} />
                  <span>開始驗證</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 驗證指令顯示 */}
        {verificationState.step === 'verifying' && (
          <div className="bg-blue-50 p-6 rounded-lg space-y-4">
            <div className="flex items-center text-blue-700 mb-2">
              <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
              <span>請在 LINE 官方帳號中輸入：</span>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <code className="text-blue-700">驗證 {user?.sub}</code>
            </div>
            <p className="text-sm text-blue-600">
              輸入驗證指令後，系統將發送驗證碼給您
            </p>
          </div>
        )}

        {/* 驗證碼輸入 */}
        {verificationState.step === 'confirming' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                驗證碼
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="請輸入 LINE 中收到的驗證碼"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                maxLength={6}
              />
            </div>
            <button
              onClick={() => confirmVerificationCode(verificationCode)}
              disabled={!verificationCode || verificationCode.length !== 6}
              className={`
                w-full py-3 rounded-lg transition-all duration-300
                flex items-center justify-center space-x-2
                ${!verificationCode || verificationCode.length !== 6
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'}
              `}
            >
              {verificationState.status === 'validating' ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <span>驗證中...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheck} />
                  <span>確認驗證</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 驗證完成狀態 */}
        {verificationState.isVerified && (
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-2 rounded-full mr-4">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-xl" />
              </div>
              <div>
                <h4 className="text-green-800 font-medium">LINE 帳號已驗證</h4>
                <p className="text-sm text-green-600">
                  您將可以透過 LINE 接收最新文章通知
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 狀態訊息 */}
        {verificationState.message && (
          <div className={`
            mt-4 p-4 rounded-lg flex items-center
            ${verificationState.status === 'error' ? 'bg-red-50 text-red-700' : 
              verificationState.status === 'success' ? 'bg-green-50 text-green-700' : 
              'bg-blue-50 text-blue-700'}
          `}>
            <FontAwesomeIcon 
              icon={
                verificationState.status === 'error' ? faExclamationCircle :
                verificationState.status === 'success' ? faCheckCircle :
                faInfoCircle
              } 
              className="mr-3"
            />
            <span>{verificationState.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileUI: React.FC<ProfileUIProps> = ({ user }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const {
    activeTab,
    setActiveTab,
    isCompactLayout,
    setIsCompactLayout,
    formData,
    recentArticles,
    showOldPassword,
    showNewPassword,
    isLoading,
    isEditable,
    setTempAvatar,
    setFormData,
    setOldPassword,
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
    settingsMessage,
    settingsStatus,
    toggleNotification, // 確保這行加入
    handleSaveNotificationSettings,
    setLineIdStatus,
    updateUser, // 從 useProfileLogic 中新增這個
    lineId,
    setLineId,
    multicastMessage,
    setMulticastMessage,
    isMulticasting,
    multicastResult,
    handleMulticast,
    verificationState,
    verificationCode,
    setVerificationCode,
    startVerification,
    confirmVerificationCode,
  } = useProfileLogic({ user });

  const router = useRouter();
  const { user: authUser } = useAuthContext();
  const [isClient, setIsClient] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
  }>({ status: null, message: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState({ type: '', content: '' });
  const [showSettingsMessage, setShowSettingsMessage] = useState(false);

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

  useEffect(() => {
    if (settingsMessage) {
      setShowSettingsMessage(true);
      const timer = setTimeout(() => {
        setShowSettingsMessage(false);
        
        if (settingsStatus !== 'success') {
          window.location.reload();
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [settingsMessage, settingsStatus]);

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
                  { tab: 'notificationSettings', label: '訂閱通知', icon: faBell },
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
                                  resetUsername(); // 開關關時用戶名
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
                      <h3 className="text-2xl font-bold text-gray-800">最觀紀錄</h3>
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
                        recentArticles.map((article: Article, index: number) => (
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
                        placeholder="入舊密碼"
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
                        {showOldPassword ? "隱" : "顯示"}
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
                        {showNewPassword ? "" : "顯示"}
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
                        <p className="mt-4 text-sm text-gray-500">用小寫字母、、特殊符來增強密碼安性</p>
                      </div>
                      {/* 安全 */}
                      <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700">安全提示</h4>
                        <p className="mt-2 text-sm text-gray-500">
                          定期更改密碼並免多個網站使用同的密碼，可以大大提高帳戶安全性。
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
                        <label htmlFor="feedbackEmail" className="block text-sm font-medium text-gray-700">電子郵</label>
                        <input
                          id="feedbackEmail"
                          name="feedbackEmail"
                          type="email"
                          value={formData.email}
                          className="mt-2 p-2 border border-gray-300 rounded w-full"
                          placeholder="入您的電子郵"
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
                          placeholder="請輸入您的問題、意見建議"
                        />
                      </div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">上傳圖片</label>
                      <input
                        id="feedbackImage1"
                        name="feedbackImage1"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const files = e.target?.files;
                          if (files && files[0]) {
                            setFormData((prevData: FormData) => ({
                              ...prevData,
                              feedbackImage: files[0],
                              password: prevData.password || '',
                              confirmPassword: prevData.confirmPassword || '',
                              feedbackTitle: prevData.feedbackTitle || '',
                              feedbackContent: prevData.feedbackContent || ''
                            }));
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
                            resetFeedbackForm(); // 重反饋表單
                            resetUploadState(); // 重置上傳狀態
                            const feedbackImageInput = document.getElementById('feedbackImage1') as HTMLInputElement;
                            if (feedbackImageInput) {
                              feedbackImageInput.value = ''; // 清空選的檔案
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
                        activityLog.map((log: ActivityLog, index: number) => (
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
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">訂閱通知</h3>
                    <div className="space-y-6">
                      {/* Email 通知設定 */}
                      <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 p-3 rounded-full">
                              <FontAwesomeIcon icon={faEnvelope} className="text-blue-600 text-xl" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-800">Email 通知</h4>
                              <p className="text-sm text-gray-500">訂閱最新文章的 Email 通知</p>
                            </div>
                          </div>
                          <SwitchField
                            label=""
                            isChecked={formData.notifications.email}
                            onChange={() => toggleNotification('email')}
                            isDisabled={isLoading}
                          />
                        </div>
                        
                        {/* 通知信箱資訊 - 添加動畫效果 */}
                        <div 
                          className={`
                            overflow-hidden transition-all duration-300 ease-in-out
                            ${formData.notifications.email ? 'max-h-24 opacity-100 mt-4' : 'max-h-0 opacity-0'}
                          `}
                        >
                          <div className="transform transition-transform duration-300 ease-in-out">
                            <label 
                              htmlFor="notificationEmail" 
                              className="block text-sm font-medium text-gray-700 mb-2"
                            >
                              通知信箱
                            </label>
                            <input
                              id="notificationEmail"
                              type="email"
                              value={formData.email}
                              disabled
                              className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>

                      {/* LINE 通知設定 */}
                      <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="bg-green-100 p-3 rounded-full">
                              <FontAwesomeIcon icon={faCommentDots} className="text-green-600 text-xl" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-800">LINE 通知</h4>
                              <p className="text-sm text-gray-500">加入官方 LINE 帳號接收最新文章通知</p>
                            </div>
                          </div>
                          <SwitchField
                            label=""
                            isChecked={formData.notifications.line}
                            onChange={() => toggleNotification('line')}
                            isDisabled={isLoading}
                          />
                        </div>

                        {/* LINE 通知內容 - 添加動畫效果 */}
                        <div 
                          className={`
                            overflow-hidden transition-all duration-300 ease-in-out
                            ${formData.notifications.line ? 'max-h-[800px] opacity-100 mt-4' : 'max-h-0 opacity-0'}
                          `}
                        >
                          <div className="transform transition-transform duration-300 ease-in-out">
                            {/* QR Code 和加入按鈕 */}
                            <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-6 bg-gray-50 rounded-lg">
                              <div className="text-center">
                                <img 
                                  src="/Line-QR-Code.png" 
                                  alt="LINE 官方帳號 QR Code" 
                                  className="w-40 h-40 mb-2"
                                />
                                <p className="text-sm text-gray-600">掃描 QR Code 加入好友</p>
                              </div>

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
                                <p className="text-sm text-gray-600 mt-2">或直接點擊加入</p>
                              </div>
                            </div>

                            {/* 驗證表單區域 */}
                            {!verificationState.isVerified ? (
                              <div className="mt-6">
                                <StepIndicator step={verificationState.step} />
                                {/* 原有的驗證表單內容 */}
                                {/* ... */}
                              </div>
                            ) : (
                              <div className="mt-6 bg-green-50 p-4 rounded-lg">
                                <div className="flex items-center">
                                  <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-3" />
                                  <div>
                                    <h4 className="text-green-800 font-medium">LINE 帳號已驗證</h4>
                                    <p className="text-sm text-green-600">
                                      您將可以透過 LINE 接收最新文章通知
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
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