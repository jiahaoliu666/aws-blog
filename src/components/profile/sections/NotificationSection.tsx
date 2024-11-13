import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faGlobe,
  faSave
} from '@fortawesome/free-solid-svg-icons';
import { faLine } from '@fortawesome/free-brands-svg-icons';
import { Switch } from '@mui/material';
import { useAuthContext } from '@/context/AuthContext';
import { useNotificationSettings } from '@/hooks/profile/useNotificationSettings';
import { toast } from 'react-toastify';
import { VerificationStep } from '@/types/lineTypes';

interface NotificationSettings {
  line: boolean;
  email: boolean;
}

interface NotificationSectionProps {
  isLoading: boolean;
  isVerifying: boolean;
  saveAllSettings: () => Promise<void>;
  notificationSettings: NotificationSettings;
  formData: any;
  handleNotificationChange: (type: keyof NotificationSettings) => void;
  lineId: string;
  setLineId: (id: string) => void;
  verificationCode: string;
  setVerificationCode: (code: string) => void;
  verificationStep: VerificationStep;
  verificationProgress: number;
  handleStartVerification: () => void;
  handleConfirmVerification: () => void;
  verificationState: {
    step: VerificationStep;
    status: string;
    isVerified: boolean;
  };
  verifyLineIdAndCode: () => void;
  handleVerification: () => void;
  onCopyUserId: () => void;
  userId: string;
}

const NotificationSectionUI: React.FC<NotificationSectionProps> = (props) => {
  const { user } = useAuthContext();
  const {
    settings,
    originalSettings,
    loading,
    handleToggle,
    saveSettings,
    resetSettings
  } = useNotificationSettings(user?.userId || '');

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const handleSave = async () => {
    if (!hasChanges) {
      toast.info('沒有需要儲存的變更', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored"
      });
      return;
    }
    await saveSettings();
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">通知設定</h1>
        <p className="mt-2 text-gray-600">管理您想要接收的通知方式</p>
      </div>

      {/* 電子郵件通知卡片 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
                  <FontAwesomeIcon icon={faEnvelope} className="text-xl text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">電子郵件通知</h3>
                  <p className="text-sm text-gray-600">接收最新消息和重要更新</p>
                </div>
              </div>
              <Switch
                checked={settings.email}
                onChange={() => handleToggle('email')}
                disabled={loading}
              />
            </div>
            
            <div className="pl-[3.25rem]">
              <input 
                type="email" 
                value={props.formData.email} 
                readOnly 
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 w-full max-w-md focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* LINE 通知卡片 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50">
                <FontAwesomeIcon icon={faLine} className="text-xl text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">LINE 通知</h3>
                <p className="text-sm text-gray-600">透過 LINE 接收即時通知</p>
              </div>
            </div>
            <Switch
              checked={settings.line}
              onChange={() => handleToggle('line')}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* 儲存按鈕區域 */}
      <div className="flex justify-end mt-6 gap-3">
        {/* 只有在有變更時才顯示取消按鈕 */}
        {JSON.stringify(settings) !== JSON.stringify(originalSettings) && (
          <button
            onClick={resetSettings}
            disabled={loading}
            className={`
              px-6 py-2.5 rounded-lg flex items-center gap-2
              ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700'}
              text-white transition-colors duration-200
            `}
          >
            取消
          </button>
        )}
        
        <button
          onClick={handleSave}
          disabled={loading || !hasChanges}
          className={`
            px-6 py-2.5 rounded-lg flex items-center gap-2
            ${loading || !hasChanges 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
            } 
            text-white transition-colors duration-200
          `}
        >
          {loading ? (
            <>
              <span className="animate-spin">⌛</span>
              儲存中...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faSave} />
              儲存設定
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationSectionUI;