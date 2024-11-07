import React, { useState, useEffect } from 'react';
import { Loader } from '@aws-amplify/ui-react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../context/AuthContext';
import { useProfileLogic } from '../../hooks/profile/useProfileLogic';
import { Settings as ProfileSettings } from '@/types/profileTypes';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';
import Sidebar from './common/Sidebar';
import ProfileSection from './sections/ProfileSection';
import PasswordSection from './sections/PasswordSection';
import NotificationSection from './sections/NotificationSection';
import SettingsSection from './sections/SettingsSection';
import FeedbackSection from './sections/FeedbackSection';
import ActivityLogSection from './sections/ActivityLogSection';

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
  email: boolean;
  push: boolean;
  line: boolean;
  browser: boolean;
  mobile: boolean;
}

interface LocalSettings {
  theme: 'light' | 'dark';
  language: string;
  autoplay: boolean;
  notifications: boolean;
  notificationPreferences: NotificationSettings;
  privacy: 'private' | 'public';
}

const ProfileUI: React.FC<ProfileUIProps> = ({ user, uploadMessage, passwordMessage, setIsEditable }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { user: authUser } = useAuthContext();
  const profileLogic = useProfileLogic({ user });

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

  const defaultSettings: LocalSettings = {
    theme: 'light',
    language: 'zh-TW',
    autoplay: false,
    notifications: true,
    notificationPreferences: {
      email: true,
      push: true,
      line: true,
      browser: true,
      mobile: true
    },
    privacy: 'private'
  };

  const settings: LocalSettings = profileLogic.settings as LocalSettings || defaultSettings;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex-grow container mx-auto px-2 sm:px-6 lg:px-8 py-4 lg:py-8 flex flex-col lg:flex-row gap-3 lg:gap-6">
        <Sidebar 
          activeTab={profileLogic.activeTab}
          setActiveTab={profileLogic.setActiveTab}
          isProfileMenuOpen={isProfileMenuOpen}
          setIsProfileMenuOpen={setIsProfileMenuOpen}
          formData={profileLogic.formData}
        />
        
        <div className="w-full lg:w-3/4 bg-white border border-gray-200 rounded-xl shadow-xl p-3 sm:p-6">
          {profileLogic.activeTab === 'profile' && (
            <ProfileSection {...profileLogic} />
          )}

          {profileLogic.activeTab === 'changePassword' && (
            <PasswordSection 
              {...profileLogic} 
              passwordMessage={profileLogic.passwordMessage || undefined}
            />
          )}

          {profileLogic.activeTab === 'notificationSettings' && (
            <NotificationSection 
              {...profileLogic} 
              user={user && {
                ...user,
                userId: user.userId || user.id,
                sub: user.sub || ''
              }}
              verificationState={String(profileLogic.verificationState)}
              checkLineFollowStatus={() => Promise.resolve(false)}
              notificationSettings={{
                email: settings.notificationPreferences?.email ?? false,
                line: settings.notificationPreferences?.line ?? false,
                browser: settings.notificationPreferences?.browser ?? false,
                mobile: settings.notificationPreferences?.mobile ?? false
              }}
              handleNotificationChange={(setting: keyof NotificationSettings) => 
                profileLogic.handleSettingChange('notificationPreferences', { 
                  ...settings.notificationPreferences!,
                  [setting]: !settings.notificationPreferences?.[setting]
                })
              }
            />
          )}

          {profileLogic.activeTab === 'settings' && (
            <SettingsSection 
              {...profileLogic}
              settings={settings}
              handleSettingChange={profileLogic.handleSettingChange}
            />
          )}

          {profileLogic.activeTab === 'feedback' && (
            <FeedbackSection 
              {...profileLogic}
              feedback={{
                rating: 0,
                category: '',
                message: profileLogic.feedback || ''
              }}
              feedbackMessage={profileLogic.feedback || undefined}
              setFeedback={(newFeedback) => {
                if (typeof newFeedback === 'object' && 'message' in newFeedback) {
                  profileLogic.setFeedback(newFeedback.message);
                } else if (typeof newFeedback === 'string') {
                  profileLogic.setFeedback(newFeedback);
                }
              }}
              handleSubmitFeedback={profileLogic.handleSubmitFeedback}
              isSubmitting={profileLogic.isSubmitting}
            />
          )}

          {profileLogic.activeTab === 'activityLog' && (
            <ActivityLogSection activityLog={profileLogic.activityLog.map((log: { action: string; date: string }) => ({
              id: crypto.randomUUID(),
              type: 'default',
              description: log.action,
              timestamp: log.date,
            }))} />
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ProfileUI;