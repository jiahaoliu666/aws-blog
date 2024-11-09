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

const ProfileUI: React.FC<ProfileUIProps> = ({ user, uploadMessage, passwordMessage, setIsEditable }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { user: authUser, logoutUser } = useAuthContext();

  const core = useProfileCore({ user });
  const form = useProfileForm({ user, updateUser: core.updateUser }) as unknown as { 
    formData: FormData, 
    handleChange: (e: any) => void,
    setFormData: React.Dispatch<React.SetStateAction<FormData>>
  };
  const avatar = useProfileAvatar({ user });
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

  useEffect(() => {
    if (core.settings) {
      setLocalSettings(core.settings as LocalSettings);
    }
  }, [core.settings]);

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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex-grow container mx-auto px-2 sm:px-6 lg:px-8 py-4 lg:py-8 flex flex-col lg:flex-row gap-3 lg:gap-6">
        <Sidebar 
          activeTab={core.activeTab}
          setActiveTab={core.setActiveTab}
          isProfileMenuOpen={isProfileMenuOpen}
          setIsProfileMenuOpen={setIsProfileMenuOpen}
          formData={form.formData}
        />
        
        <div className="w-full lg:w-3/4 bg-white border border-gray-200 rounded-xl shadow-xl p-3 sm:p-6">
          {core.activeTab === 'profile' && (
            <ProfileSection 
              {...form} 
              {...avatar}
              setFormData={form.setFormData}
              handleSubmit={core.handleSubmit}
              isEditable={{ username: true }}
              localUsername={form.formData.username}
              setLocalUsername={(username: string) => form.handleChange({ target: { name: 'username', value: username } })}
              toggleEditableField={() => setIsEditable()}
              isSubmitting={core.isSubmitting}
              handleSaveProfileChanges={(username: string) => {
                form.handleChange({ target: { name: 'username', value: username } });
                core.handleSubmit(new Event('submit') as unknown as FormEvent<Element>);
              }}
              handleCancelChanges={() => setIsEditable()}
              resetUsername={() => form.handleChange({ target: { name: 'username', value: user?.username || '' } })}
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
              verifyLineIdAndCode={async () => {
                return Promise.resolve();
              }}
              user={user && {
                ...user,
                userId: user.userId || user.id,
                sub: user.sub || ''
              }}
              verificationState={{
                step: 'INITIAL' as VerificationStep,
                status: '',
                message: '',
                isVerified: false
              }}
              notificationSettings={{
                all: localSettings?.notificationPreferences?.all ?? defaultNotificationPreferences.all,
                line: localSettings?.notificationPreferences?.line ?? defaultNotificationPreferences.line,
                browser: localSettings?.notificationPreferences?.browser ?? defaultNotificationPreferences.browser,
                mobile: localSettings?.notificationPreferences?.mobile ?? defaultNotificationPreferences.mobile,
                email: localSettings?.notificationPreferences?.email ?? defaultNotificationPreferences.email
              }}
              handleNotificationChange={(setting: keyof NotificationSettings) => {
                const currentPreferences = localSettings?.notificationPreferences ?? defaultNotificationPreferences;
                const updatedPreferences = {
                  ...currentPreferences,
                  [setting]: !currentPreferences[setting]
                };

                setLocalSettings(prev => ({
                  ...prev,
                  notificationPreferences: updatedPreferences
                }));

                core.handleSettingChange('notificationPreferences', updatedPreferences);
              }}
              lineId={lineSettings.lineUserId || ''}
              setLineId={(id: string) => {/* 處理 lineId 更新的邏輯 */}}
              verificationCode=""
              setVerificationCode={() => {}}
              handleVerification={async () => {}}
              onCopyUserId={() => {}}
              userId={user?.userId || ''}
              formData={form.formData}
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
  );
};

export default ProfileUI;