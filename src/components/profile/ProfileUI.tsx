import React, { useState, useEffect, FormEvent } from 'react';
import { Loader } from '@aws-amplify/ui-react';
import { useRouter } from 'next/router';
import { useAuthContext } from '@/context/AuthContext';
import {
  useProfileCore,
  useProfileForm,
  useProfileAvatar,
  useProfilePassword,
  useProfileActivity,
  useProfileArticles,
  useProfileNotifications
} from '@/hooks/profile';
import { useLineVerification, useLineSettings } from '@/hooks/line';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';
import Sidebar from './common/Sidebar';
import ProfileSection from './sections/ProfileSection';
import PasswordSection from './sections/PasswordSection';
import NotificationSection from './sections/NotificationSection';
import SettingsSection from './sections/SettingsSection';
import FeedbackSection from './sections/FeedbackSection';
import ActivityLogSection from './sections/ActivityLogSection';
import HistorySection from './sections/HistorySection';
import { VerificationStep } from '@/types/lineTypes';
import { FormData } from '@/types/profileTypes';
import { ToastProvider } from '@/context/ToastContext';

interface ProfileUIProps {
  user: {
    id: string;
    username: string;
    email: string;
    avatar: string;
    accessToken: string;
    refreshToken: string;
    userId: string;
    sub: string;
  } | null;
  uploadMessage: string;
  passwordMessage: string;
  setIsEditable: () => void;
}

interface NotificationSettings {
  all?: boolean;
  line: boolean;
  browser: boolean;
  mobile: boolean;
  push?: boolean;
  email: boolean;
}

interface LocalSettings {
  theme: 'light' | 'dark';
  language: string;
  autoplay: boolean;
  notifications: boolean;
  notificationPreferences: NotificationSettings;
  privacy: 'private' | 'public';
}

interface ActivityLog {
  action: string;
  timestamp: string;
}

const defaultNotificationPreferences: NotificationSettings = {
  line: false,
  browser: false,
  mobile: false,
  all: false,
  push: false,
  email: false
};

const defaultSettings: LocalSettings = {
  theme: 'light',
  language: 'zh-TW',
  autoplay: false,
  notifications: true,
  notificationPreferences: defaultNotificationPreferences,
  privacy: 'private'
};

const ProfileUI: React.FC<ProfileUIProps> = ({ user, uploadMessage: initialUploadMessage, passwordMessage, setIsEditable }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { user: authUser, logoutUser } = useAuthContext();

  const core = useProfileCore({ user });
  const form = useProfileForm({ user, updateUser: core.updateUser }) as unknown as { 
    formData: FormData, 
    handleChange: (e: any) => void,
    setFormData: React.Dispatch<React.SetStateAction<FormData>>,
    isEditable: { username: boolean },
    localUsername: string,
    setLocalUsername: (username: string) => void,
    handleEditClick: () => void,
    handleCancelChanges: () => void,
    handleSaveProfileChanges: () => void,
    isLoading: boolean
  };
  const avatar = useProfileAvatar({ user, updateUser: core.updateUser, setFormData: form.setFormData });
  const password = useProfilePassword({ user, handleLogout: logoutUser });
  const activity = useProfileActivity({ user });
  const articles = useProfileArticles({ user });
  const notifications = useProfileNotifications();
  const lineVerification = useLineVerification({ 
    user,
    updateUserLineSettings: () => Promise.resolve()
  });
  const lineSettings = useLineSettings({ user });

  const [localSettings, setLocalSettings] = useState<LocalSettings>(defaultSettings);

  const [verificationCode, setVerificationCode] = useState('');

  useEffect(() => {
    if (core.settings) {
      if (JSON.stringify(localSettings) !== JSON.stringify(core.settings)) {
        setLocalSettings(core.settings as LocalSettings);
      }
    }
  }, [core.settings]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const userInStorage = window.localStorage.getItem("user");
    if (!authUser && !userInStorage) {
      const timer = setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [authUser, router, isClient]);

  const handleVerifyLineIdAndCode = async () => {
    // 實作驗證邏輯
    try {
      // 呼叫驗證 API
      const response = await fetch('/api/line/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.userId,
          lineId: lineSettings.lineUserId,
          verificationCode
        }),
      });

      if (!response.ok) {
        throw new Error('驗證失敗');
      }

      // 處理成功響應
    } catch (error) {
      console.error('驗證過程發生錯誤:', error);
    }
  };

  if (!isClient) return null;

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

  const handleNotificationSettingChange = (setting: keyof NotificationSettings) => {
    const updatedPreferences = {
      ...localSettings.notificationPreferences,
      [setting]: !localSettings.notificationPreferences[setting]
    };

    setLocalSettings(prev => ({
      ...prev,
      notificationPreferences: updatedPreferences
    }));

    core.handleSettingChange('notificationPreferences', updatedPreferences);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="flex-grow container mx-auto px-2 sm:px-6 lg:px-8 py-4 lg:py-8 flex flex-col lg:flex-row gap-3 lg:gap-6">
          <Sidebar 
            activeTab={core.activeTab}
            setActiveTab={core.setActiveTab}
            isProfileMenuOpen={isProfileMenuOpen}
            setIsProfileMenuOpen={setIsProfileMenuOpen}
            formData={form.formData}
            tempAvatar={avatar.tempAvatar}
          />
          
          <div className="w-full lg:w-3/4 bg-white border border-gray-200 rounded-xl shadow-xl p-3 sm:p-6">
            {core.activeTab === 'profile' && (
              <ProfileSection 
                formData={form.formData}
                isEditable={form.isEditable}
                localUsername={form.localUsername}
                setLocalUsername={form.setLocalUsername}
                handleEditClick={form.handleEditClick}
                handleCancelChanges={form.handleCancelChanges}
                handleSaveProfileChanges={form.handleSaveProfileChanges}
                isLoading={form.isLoading || avatar.isUploading}
                uploadMessage={avatar.uploadMessage}
                handleAvatarChange={avatar.handleAvatarChange}
                tempAvatar={avatar.tempAvatar}
                handleSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  core.handleSubmit(e);
                }}
                isSubmitting={core.isSubmitting}
                errorMessage={core.errorMessage}
                toggleEditableField={() => setIsEditable()}
                resetUsername={form.handleCancelChanges}
                setFormData={form.setFormData}
                setIsEditable={setIsEditable}
              />
            )}

            {core.activeTab === 'changePassword' && (
              <PasswordSection 
                {...password} 
                passwordMessage={password.passwordMessage || undefined}
                newPassword={password.newPassword || ''}
                setNewPassword={password.setNewPassword}
                formData={{
                  password: form.formData.password,
                  confirmPassword: form.formData.confirmPassword
                }}
                handleChange={form.handleChange}
              />
            )}

            {core.activeTab === 'notificationSettings' && (
              <NotificationSection 
                {...(notifications as unknown as object)} 
                isLoading={false}
                isVerifying={false}
                lineId={lineSettings.lineUserId}
                setLineId={lineSettings.setLineUserId}
                verificationCode={verificationCode}
                setVerificationCode={setVerificationCode}
                verificationStep={VerificationStep.IDLE}
                verificationProgress={0}
                handleStartVerification={() => lineVerification.handleVerification()}
                handleConfirmVerification={() => lineVerification.confirmVerification(verificationCode)}
                verificationState={{
                  step: VerificationStep.IDLE,
                  status: '',
                  isVerified: false
                }}
                verifyLineIdAndCode={handleVerifyLineIdAndCode}
                handleVerification={handleVerifyLineIdAndCode}
                onCopyUserId={() => {/* 實作複製用戶ID的邏輯 */}}
                userId={user?.userId || ''}
                handleNotificationChange={(type) => {/* 實作通知設定變更的邏輯 */}}
                notificationSettings={{
                  email: false,
                  line: false,
                  browser: false,
                  mobile: false
                }}
              />
            )}

            {core.activeTab === 'settings' && (
              <SettingsSection 
                {...core}
                settings={localSettings}
                handleSettingChange={core.handleSettingChange}
              />
            )}

            {core.activeTab === 'feedback' && (
              <FeedbackSection 
                {...core}
                feedback={{
                  rating: 0,
                  category: '',
                  message: core.feedback || ''
                }}
                feedbackMessage={core.feedback || undefined}
                setFeedback={(newFeedback) => {
                  if (typeof newFeedback === 'object' && 'message' in newFeedback) {
                    core.setFeedback(newFeedback.message);
                  } else if (typeof newFeedback === 'string') {
                    core.setFeedback(newFeedback);
                  }
                }}
                handleSubmitFeedback={() => core.handleSubmitFeedback(core.feedback || '')}
                isSubmitting={core.isSubmitting}
              />
            )}

            {core.activeTab === 'activityLog' && (
              <ActivityLogSection activityLog={activity.activityLog.map((log: ActivityLog) => ({
                id: crypto.randomUUID(),
                type: 'default',
                description: log.action,
                timestamp: log.timestamp
              }))} />
            )}

            {core.activeTab === 'history' && (
              <HistorySection 
                recentArticles={articles.recentArticles}
              />
            )}
          </div>
        </div>
        
        <Footer />
      </div>
    </ToastProvider>
  );
};

export default ProfileUI;