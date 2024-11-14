import React, { useState, useEffect, FormEvent, Dispatch, SetStateAction } from 'react';
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
} from '@/hooks/profile';
import { useLineVerification  } from '@/hooks/line';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';
import Sidebar from './common/Sidebar';
import ProfileSection from './sections/ProfileSection';
import PasswordSection from './sections/PasswordSection';
import NotificationSection from './sections/NotificationSection';
import PreferencesSection from './sections/PreferencesSection';
import FeedbackSection from './sections/FeedbackSection';
import ActivityLogSection from './sections/ActivityLogSection';
import HistorySection from './sections/HistorySection';
import { VerificationStep, VerificationStatus, VerificationState, VERIFICATION_PROGRESS } from '@/types/lineTypes';
import { FormData } from '@/types/profileTypes';
import { ToastProvider } from '@/context/ToastContext';
import AccountSection from './sections/AccountSection';
import { useProfileAccount } from '@/hooks/profile';
import { useProfilePreferences } from '@/hooks/profile/useProfilePreferences';
import '@aws-amplify/ui-react/styles.css';  
import { useToastContext } from '@/context/ToastContext';
import { useNotificationSettings } from '@/hooks/profile/useNotificationSettings';
import { logger } from '@/utils/logger';

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
  verificationState: VerificationState;
  setVerificationState: Dispatch<SetStateAction<VerificationState>>;
}

interface NotificationSettings {
  all?: boolean;
  line: boolean;
  browser: boolean;
  mobile: boolean;
  push: boolean;
  email: boolean;
  lineUserId?: string;
}

interface LocalSettings {
  theme: 'light' | 'dark';
  language: string;
  autoSummarize: boolean;
  viewMode: 'grid' | 'list' | 'compact';
  notifications: boolean;
  notificationPreferences: NotificationSettings;
  privacy: 'private' | 'public';
}

interface ActivityLog {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  parsedDate: Date;
  details?: string;
  status?: string;
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
  autoSummarize: false,
  viewMode: 'grid',
  notifications: true,
  notificationPreferences: defaultNotificationPreferences,
  privacy: 'private'
};

const ProfileUI: React.FC<ProfileUIProps> = ({ user: propUser, uploadMessage, passwordMessage, setIsEditable, verificationState, setVerificationState }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user: authUser, logoutUser } = useAuthContext();

  const currentUser = authUser || propUser;

  const core = useProfileCore({ user: currentUser });
  const form = useProfileForm({ user: currentUser, updateUser: core.updateUser }) as unknown as { 
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
  const avatar = useProfileAvatar({ user: currentUser, updateUser: core.updateUser, setFormData: form.setFormData });
  const password = useProfilePassword({ user: currentUser, handleLogout: logoutUser });
  const activity = useProfileActivity({ user: currentUser });
  const articles = useProfileArticles({ user: currentUser });
  const lineVerification = useLineVerification();

  const [localSettings, setLocalSettings] = useState<LocalSettings>(defaultSettings);

  const [verificationCode, setVerificationCode] = useState('');

  const account = useProfileAccount({ user: currentUser });

  const { preferences, updatePreferences, isLoading: preferencesLoading } = useProfilePreferences();

  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showRedirectMessage, setShowRedirectMessage] = useState(false);

  const toast = useToastContext();

  const { 
    settings,
    loading: notificationsLoading, 
    handleToggle: handleNotificationToggle,
    saveSettings: updateNotificationSettings,
    hasChanges: hasNotificationChanges,
    reloadSettings
  } = useNotificationSettings(currentUser?.userId || '') as unknown as {
    settings: Partial<{
      line: boolean;
      email: boolean;
      browser: boolean;
      mobile: boolean;
      push: boolean;
    }>;
    loading: boolean;
    handleToggle: (type: keyof NotificationSettings, value: boolean) => Promise<void>;
    saveSettings: () => Promise<void>;
    hasChanges: boolean;
    reloadSettings: () => Promise<void>;
  };

  const [verificationStep, setVerificationStep] = useState<VerificationStep>(VerificationStep.SCAN_QR);

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
    
    const checkAuthAndRedirect = async () => {
      const storedUser = window.localStorage.getItem("user");
      
      if (!currentUser && !storedUser && !isRedirecting) {
        setIsRedirecting(true);
        setShowRedirectMessage(true);
        
        try {
          await Promise.all([
            new Promise(resolve => setTimeout(resolve, 1500)),
            new Promise(resolve => {
              setTimeout(() => {
                router.push('/auth/login').then(resolve);
              }, 1500);
            })
          ]);
        } catch (error) {
          console.error('重導失敗:', error);
          setShowRedirectMessage(false);
        } finally {
          setIsRedirecting(false);
        }
      }
    };

    checkAuthAndRedirect();
  }, [currentUser, router, isClient, isRedirecting]);

  const handleVerifyLineIdAndCode = async () => {
    try {
      setIsLoading(true);
      
      logger.info('發送驗證請求:', {
        userId: currentUser?.userId,
        verificationCode
      });

      const response = await fetch('/api/line/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser?.userId,
          code: verificationCode
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '驗證失敗');
      }

      setVerificationStep(VerificationStep.COMPLETED);
      toast.success('LINE 帳號驗證成功');
      
      await updateNotificationSettings();

      if (reloadSettings) {
        await reloadSettings();
      }

    } catch (error) {
      logger.error('驗證過程發生錯誤:', error);
      toast.error(error instanceof Error ? error.message : '驗證失敗，請稍後再');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetVerification = async () => {
    try {
      // 重置所有驗證相關的狀態
      setVerificationStep(VerificationStep.SCAN_QR);
      setVerificationCode('');
      setIsLoading(false);
      
      // 重置 LINE 設定狀
      await handleNotificationToggle('line', false); // 強制為 false
      
      // 更新通知設定
      await updateNotificationSettings();
      
      // 重新載入設定
      if (reloadSettings) {
        await reloadSettings();
      }
      
      toast.info('請重新完成 LINE 驗證流程');
    } catch (error) {
      console.error('重置驗證狀態失敗:', error);
      toast.error('重置失敗，請稍後再試');
    }
  };

  if (!isClient) return null;

  const storedUser = typeof window !== 'undefined' ? localStorage.getItem("user") : null;
  
  if (!currentUser && !storedUser && showRedirectMessage) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-100 to-gray-300">
        <Navbar />
        <div className="flex items-center justify-center flex-grow px-4 py-8">
          <div className="text-center py-10">
            <Loader className="mb-4" size="large" />
            <h2 className="text-2xl font-semibold text-red-600">請先登入！</h2>
            <p className="text-lg text-gray-700">重新導向至登入頁面...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleNotificationChange = async (
    type: 'line' | 'email' | 'browser' | 'mobile' | 'push',
    forceValue?: boolean
  ) => {
    if (!currentUser?.userId) {
      toast.error('請先登入');
      return;
    }

    try {
      const newValue = forceValue !== undefined ? forceValue : !settings[type];
      
      // 檢查 LINE 驗證狀態
      if (type === 'line' && newValue) {
        if (verificationState.status !== VerificationStatus.SUCCESS) {
          toast.warning('請先完成 LINE 帳號驗證');
          return;
        }
      }

      await handleNotificationToggle(type, newValue);
      
      if (type === 'line' && !newValue) {
        setVerificationStep(VerificationStep.SCAN_QR);
        setVerificationCode('');
      }
      
      // 重新載入設定以確保狀態同步
      await reloadSettings();
      
    } catch (error) {
      console.error('切換通知設定失敗:', error);
      toast.error('設定切換失敗，請稍後再試');
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    // ... 處理設定變更
  };

  const handleSave = async (settings: any) => {
    console.log('接收到要儲存的設定:', settings);
    await updatePreferences(settings);
  };

  const handleSaveNotificationSettings = async () => {
    if (!currentUser?.userId) {
      toast.error('請先登入');
      return;
    }

    if (!hasNotificationChanges) {
      toast.info('沒有需要儲存的變更');
      return;
    }

    try {
      await updateNotificationSettings();
      toast.success('通知設定已更新');
    } catch (error) {
      console.error('更新通知設定失敗:', error);
      toast.error('設定更新失敗，請稍後再試');
    }
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
                isLoading={notificationsLoading}
                isVerifying={isLoading}
                saveAllSettings={handleSaveNotificationSettings}
                notificationSettings={{
                  line: settings.line ?? false,
                  email: settings.email ?? false,
                }}
                formData={form.formData}
                handleNotificationChange={handleNotificationChange}
                verificationCode={verificationCode}
                setVerificationCode={setVerificationCode}
                verificationStep={verificationStep}
                verificationProgress={verificationState?.progress ?? VERIFICATION_PROGRESS.INITIAL}
                handleStartVerification={handleVerifyLineIdAndCode}
                handleConfirmVerification={handleVerifyLineIdAndCode}
                verificationState={verificationState}
                setVerificationState={setVerificationState}
                handleResetVerification={handleResetVerification}
                verifyLineIdAndCode={handleVerifyLineIdAndCode}
                handleVerification={handleVerifyLineIdAndCode}
                onCopyUserId={() => {
                  navigator.clipboard.writeText(currentUser?.userId || '');
                  toast.success('已複製用戶 ID');
                }}
                onCopyLineId={() => {
                  navigator.clipboard.writeText('@601feiwz');
                  toast.success('已複製官方 LINE ID');
                }}
                userId={currentUser?.userId || ''}
                lineOfficialId="@601feiwz"
                setVerificationStep={setVerificationStep}
              />
            )}

            {core.activeTab === 'preferences' && (
              <PreferencesSection
                settings={preferences}
                handleSettingChange={handleSettingChange}
                onSave={handleSave}
                isLoading={preferencesLoading}
              />
            )}

            {core.activeTab === 'feedback' && (
              <FeedbackSection 
                feedback={core.feedback}
                setFeedback={core.setFeedback}
                handleSubmitFeedback={core.handleSubmitFeedback}
                isSubmitting={core.isSubmitting}
                userEmail={form.formData.email}
                attachments={core.attachments}
                handleAttachmentChange={(e) => {
                  if (e.target.files) {
                    const files = Array.from(e.target.files);
                    core.setAttachments(prev => [...prev, ...files]);
                  }
                }}
                removeAttachment={(index) => {
                  core.setAttachments(prev => prev.filter((_, i) => i !== index));
                }}
              />
            )}

            {core.activeTab === 'activityLog' && (
              <ActivityLogSection 
                activityLog={activity.activityLog.map(log => ({
                  ...log,
                  parsedDate: new Date(log.timestamp)
                }))}
              />
            )}

            {core.activeTab === 'history' && (
              <HistorySection 
                recentArticles={articles.recentArticles}
              />
            )}

            {core.activeTab === 'accountManagement' && (
              <AccountSection 
                {...account}
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