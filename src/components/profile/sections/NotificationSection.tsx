import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faGlobe,
  faSave,
  faCheckCircle,
  faQrcode,
  faArrowRight,
  faShield
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
    resetSettings,
    verificationStep,
    verificationProgress,
    isVerified,
    startVerification,
    handleVerification,
    completeVerification,
  } = useNotificationSettings(props.userId);

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const handleSave = async () => {
    if (!hasChanges) {
      toast.info('沒有需要儲存的變更');
      return;
    }

    if (settings.line && !isVerified) {
      toast.warning('請先完成 LINE 驗證流程');
      return;
    }

    await saveSettings();
  };

  const handleLineToggle = async () => {
    if (!settings.line) {
      await handleToggle('line');
    } else {
      if (window.confirm('確定要關閉 LINE 通知嗎？這將會清除您的驗證狀態。')) {
        await handleToggle('line');
      }
    }
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        {/* 卡片標題區域 */}
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-50">
                <FontAwesomeIcon icon={faLine} className="text-2xl text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">LINE 通知</h3>
                <p className="text-sm text-gray-600">透過 LINE 接收即時通知與重要更新</p>
              </div>
            </div>
            <Switch
              checked={settings.line}
              onChange={handleLineToggle}
              disabled={loading}
              className="scale-110"
            />
          </div>
        </div>

        {/* 驗證流程區域 */}
        {settings.line && !isVerified && (
          <div className="p-6 bg-gray-50">
            {/* 進度條 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">驗證進度</span>
                <span className="text-sm text-gray-500">{verificationProgress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300 rounded-full"
                  style={{ width: `${verificationProgress}%` }}
                />
              </div>
            </div>

            {/* 驗證步驟 */}
            <div className="space-y-6">
              {/* 步驟 1: 加入好友 */}
              <div className={`p-4 rounded-xl border ${
                verificationStep === VerificationStep.ADD_FRIEND 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      verificationStep === VerificationStep.ADD_FRIEND 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <FontAwesomeIcon icon={faQrcode} />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-800">步驟 1：加入官方帳號</h4>
                      {verificationStep === VerificationStep.ADD_FRIEND && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">進行中</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      請掃描 QR Code 或透過 LINE ID 加入我們的官方帳號
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={props.onCopyUserId}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <span>複製 LINE ID</span>
                        <code className="px-2 py-0.5 bg-gray-100 rounded text-xs">@example</code>
                      </button>
                      <button
                        onClick={props.handleStartVerification}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                      >
                        <span>已加入好友</span>
                        <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 步驟 2: 輸入 LINE ID */}
              <div className={`p-4 rounded-xl border ${
                verificationStep === VerificationStep.INPUT_LINE_ID 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      verificationStep === VerificationStep.INPUT_LINE_ID 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <FontAwesomeIcon icon={faLine} />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-800">步驟 2：輸入 LINE ID</h4>
                      {verificationStep === VerificationStep.INPUT_LINE_ID && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">進行中</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      請輸入您的 LINE ID，以便我們驗證您的身份
                    </p>
                    {verificationStep === VerificationStep.INPUT_LINE_ID && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={props.lineId}
                          onChange={(e) => props.setLineId(e.target.value)}
                          placeholder="請輸入您的 LINE ID"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          onClick={props.handleVerification}
                          className="w-full sm:w-auto px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        >
                          下一步
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 步驟 3: 驗證碼確認 */}
              <div className={`p-4 rounded-xl border ${
                verificationStep === VerificationStep.VERIFY_CODE 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      verificationStep === VerificationStep.VERIFY_CODE 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <FontAwesomeIcon icon={faShield} />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-800">步驟 3：輸入驗證碼</h4>
                      {verificationStep === VerificationStep.VERIFY_CODE && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">進行中</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      請輸入我們透過 LINE 發送給您的 6 位數驗證碼
                    </p>
                    {verificationStep === VerificationStep.VERIFY_CODE && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={props.verificationCode}
                          onChange={(e) => props.setVerificationCode(e.target.value)}
                          placeholder="請輸入 6 位數驗證碼"
                          maxLength={6}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={props.verifyLineIdAndCode}
                            className="flex-1 px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                          >
                            驗證
                          </button>
                          <button
                            onClick={() => {/* 重新發送驗證碼邏輯 */}}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            重新發送
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 驗證完成狀態 */}
        {settings.line && isVerified && (
          <div className="p-6 bg-green-50">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-green-500 text-white flex items-center justify-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-xl" />
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">LINE 通知已啟用</h4>
                <p className="text-sm text-gray-600">您將可以透過 LINE 接收所有重要通知</p>
              </div>
            </div>
          </div>
        )}
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