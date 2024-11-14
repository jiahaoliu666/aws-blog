import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faGlobe,
  faSave,
  faCheckCircle,
  faQrcode,
  faArrowRight,
  faShield,
  faInfoCircle,
  faUserPlus,
  faPaperPlane,
  faExclamationTriangle,
  faCopy
} from '@fortawesome/free-solid-svg-icons';
import { faLine } from '@fortawesome/free-brands-svg-icons';
import { Switch } from '@mui/material';
import { useAuthContext } from '@/context/AuthContext';
import { useNotificationSettings } from '@/hooks/profile/useNotificationSettings';
import { toast } from 'react-toastify';
import { VerificationStep, VerificationStatus } from '@/types/lineTypes';
import { useLineVerification } from '@/hooks/line/useLineVerification';
import { LINE_RETRY_COUNT } from '@/config/line';

interface NotificationSettings {
  line: boolean;
  email: boolean;
  lineUserId?: string;
}

interface NotificationSectionProps {
  isLoading: boolean;
  isVerifying: boolean;
  saveAllSettings: () => Promise<void>;
  notificationSettings: NotificationSettings;
  formData: any;
  handleNotificationChange: (type: keyof NotificationSettings) => void;
  lineId?: string;
  setLineId?: (id: string) => void;
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
  onCopyLineId: () => void;
  userId: string;
  lineOfficialId: string;
  setVerificationStep: (step: VerificationStep) => void;
}

interface StepIndicatorsProps {
  currentStep: VerificationStep;
  onStepClick: (step: VerificationStep) => void;
}

const StepIndicators: React.FC<StepIndicatorsProps> = ({ currentStep, onStepClick }) => {
  const steps = [
    { step: VerificationStep.SCAN_QR, label: '掃描 QR Code', icon: faQrcode },
    { step: VerificationStep.ADD_FRIEND, label: '加入好友', icon: faUserPlus },
    { step: VerificationStep.SEND_ID, label: '發送 ID', icon: faPaperPlane },
    { step: VerificationStep.VERIFY_CODE, label: '驗證確認', icon: faShield }
  ];

  return (
    <div className="flex justify-between relative">
      {steps.map(({ step, label, icon }, index) => (
        <div 
          key={step}
          className="relative flex flex-col items-center w-1/4"
        >
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center z-10
            transition-all duration-300 ease-in-out
            ${currentStep === step 
              ? 'bg-green-500 text-white shadow-lg scale-110' 
              : currentStep > step
                ? 'bg-green-200 text-green-700'
                : 'bg-gray-100 text-gray-400'
            }
          `}>
            <FontAwesomeIcon icon={icon} className="text-lg" />
          </div>
          <span className={`
            text-sm mt-3 font-medium transition-colors duration-300
            ${currentStep === step ? 'text-green-600' : 'text-gray-500'}
          `}>
            {label}
          </span>
          {index < steps.length - 1 && (
            <div className={`
              absolute top-6 left-1/2 w-full h-0.5
              ${currentStep > step ? 'bg-green-500' : 'bg-gray-200'}
            `} />
          )}
        </div>
      ))}
    </div>
  );
};

interface StepProps {
  onBack?: () => void;
  onNext?: () => void;
  onCopyLineId?: () => void;
}

const QRCodeStep: React.FC<StepProps> = ({ onNext, onCopyLineId }) => (
  <div className="max-w-2xl mx-auto text-center">
    <div className="bg-white p-8 rounded-2xl shadow-lg mb-6 border border-gray-100">
      <div className="flex items-center justify-center gap-12">
        {/* QR Code 區塊 */}
        <div className="text-center">
          <div className="mb-4">
            <img 
              src="/Line-QR-Code.png" 
              alt="LINE QR Code" 
              className="w-48 h-48"
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">掃描 QR Code</h3>
          <p className="text-gray-600 text-sm">
            開啟 LINE 應用程式
            <br />點擊「加入好友」後掃描
          </p>
        </div>

        {/* 分隔線 */}
        <div className="h-64 w-px bg-gray-200 relative">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                        bg-white text-gray-400 px-2 text-sm">
            或
          </div>
        </div>

        {/* LINE ID 搜尋區塊 */}
        <div className="text-center">
          <div className="mb-4">
            <div className="w-48 h-48 flex items-center justify-center">
              <div className="text-center">
                <FontAwesomeIcon icon={faLine} className="text-5xl text-green-500 mb-4" />
                <div className="relative group">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-3 pr-12
                                font-mono text-lg text-gray-700 select-all">
                    @601feiwz
                  </div>
                  <button
                    onClick={onCopyLineId}
                    className="absolute right-2 top-1/2 -translate-y-1/2
                             p-2 rounded-md hover:bg-gray-100 
                             text-gray-500 hover:text-gray-700
                             transition-all duration-200"
                    title="複製 LINE ID"
                  >
                    <FontAwesomeIcon icon={faCopy} className="text-lg" />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 
                                   bg-gray-800 text-white text-xs py-1 px-2 rounded 
                                   opacity-0 group-hover:opacity-100 transition-opacity">
                      複製
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">搜尋 LINE ID</h3>
          <p className="text-gray-600 text-sm">
            開啟 LINE 應用程式
            <br />搜尋 ID 加入好友
          </p>
        </div>
      </div>
    </div>

    <button
      onClick={onNext}
      className="bg-green-500 text-white px-8 py-3 rounded-xl hover:bg-green-600 
                 transition-all duration-300 shadow-md hover:shadow-lg transform 
                 hover:-translate-y-0.5 flex items-center gap-2 mx-auto"
    >
      <span>下一步</span>
      <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
    </button>
  </div>
);

const AddFriendStep: React.FC<StepProps> = ({ onBack, onNext }) => (
  <div className="text-center">
    <div className="bg-white p-8 rounded-xl mb-6 inline-block">
      <FontAwesomeIcon icon={faUserPlus} className="text-5xl text-green-500 mb-4" />
      <h3 className="text-xl font-semibold mb-3">加入好友</h3>
      <p className="text-gray-600">請確認您已將我們的官方帳號加為好友</p>
    </div>
    <div className="flex justify-center gap-4">
      <button
        onClick={onBack}
        className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-colors"
      >
        返回
      </button>
      <button
        onClick={onNext}
        className="bg-green-500 text-white px-6 py-2.5 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
      >
        <span>下一步</span>
        <FontAwesomeIcon icon={faArrowRight} />
      </button>
    </div>
  </div>
);

const SendIdStep: React.FC<StepProps & { 
  userId: string; 
  onCopyUserId: () => void;
  onBack: () => void;
  onNext: () => void;
  onSendId: () => Promise<void>;
  isLoading: boolean;
}> = ({ 
  onBack, 
  onNext, 
  userId,
  onCopyUserId,
  onSendId,
  isLoading 
}) => (
  <div className="text-center">
    <div className="bg-white p-8 rounded-xl mb-6">
      <FontAwesomeIcon icon={faPaperPlane} className="text-5xl text-green-500 mb-4" />
      <h3 className="text-xl font-semibold mb-3">發送您的用戶 ID</h3>
      <p className="text-gray-600 mb-6">請將以下 ID 複製並發送給官方帳號</p>
      
      {/* 優化後的 ID 複製區域 */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="relative group">
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-3 pr-12
                        font-mono text-lg text-gray-700 select-all">
            {userId}
          </div>
          <button
            onClick={onCopyUserId}
            className="absolute right-2 top-1/2 -translate-y-1/2
                     p-2 rounded-md hover:bg-gray-100 
                     text-gray-500 hover:text-gray-700
                     transition-all duration-200"
            title="複製 ID"
          >
            <FontAwesomeIcon icon={faCopy} className="text-lg" />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 
                           bg-gray-800 text-white text-xs py-1 px-2 rounded 
                           opacity-0 group-hover:opacity-100 transition-opacity">
              複製
            </span>
          </button>
        </div>
      </div>

      {/* 提示訊息 */}
      <div className="text-sm text-gray-500 flex items-center justify-center gap-2 mb-4">
        <FontAwesomeIcon icon={faInfoCircle} />
        <span>點擊右側按鈕即可複製 ID</span>
      </div>
    </div>

    <div className="flex justify-center gap-4">
      <button
        onClick={onBack}
        disabled={isLoading}
        className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg 
                   hover:bg-gray-200 transition-colors"
      >
        返回
      </button>
      <button
        onClick={async () => {
          await onSendId();
          onNext();
        }}
        disabled={isLoading}
        className="bg-green-500 text-white px-6 py-2.5 rounded-lg 
                   hover:bg-green-600 transition-colors 
                   flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⌛</span>
            發送中...
          </>
        ) : (
          <>
            <span>下一步</span>
            <FontAwesomeIcon icon={faArrowRight} />
          </>
        )}
      </button>
    </div>
  </div>
);

const VerifyCodeStep: React.FC<{
  verificationCode: string;
  setVerificationCode: (code: string) => void;
  onBack: () => void;
  onVerify: () => void;
  isLoading: boolean;
}> = ({ verificationCode, setVerificationCode, onBack, onVerify, isLoading }) => (
  <div className="text-center">
    <div className="bg-white p-8 rounded-xl mb-6">
      <FontAwesomeIcon icon={faShield} className="text-5xl text-green-500 mb-4" />
      <h3 className="text-xl font-semibold mb-3">輸入驗證碼</h3>
      <p className="text-gray-600 mb-4">請輸入官方帳號傳送給您的驗證碼</p>
      <input
        type="text"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        placeholder="請輸入驗證碼"
        className="w-48 px-4 py-2 border border-gray-200 rounded-lg text-center text-xl tracking-wider mb-4"
        maxLength={6}
      />
      <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
        <FontAwesomeIcon icon={faInfoCircle} />
        <span>驗證碼將在 5 分鐘後失效</span>
      </div>
    </div>
    <div className="flex justify-center gap-4">
      <button
        onClick={onBack}
        className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-colors"
      >
        返回
      </button>
      <button
        onClick={onVerify}
        className="bg-green-500 text-white px-6 py-2.5 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
      >
        <span>驗證</span>
        <FontAwesomeIcon icon={faCheckCircle} />
      </button>
    </div>
  </div>
);

const NotificationSectionUI: React.FC<NotificationSectionProps> = ({
  isLoading,
  isVerifying,
  saveAllSettings,
  notificationSettings,
  formData,
  handleNotificationChange,
  lineId,
  setLineId,
  verificationCode,
  setVerificationCode,
  verificationStep,
  verificationProgress,
  handleStartVerification,
  handleConfirmVerification,
  verificationState,
  verifyLineIdAndCode,
  handleVerification,
  onCopyUserId,
  onCopyLineId,
  userId,
  lineOfficialId,
  setVerificationStep,
}) => {
  const { user } = useAuthContext();
  const {
    settings,
    originalSettings,
    loading,
    handleToggle,
    saveSettings,
    resetSettings,
    verificationStep: contextVerificationStep,
    verificationProgress: contextVerificationProgress,
    isVerified,
    startVerification,
    handleVerification: contextHandleVerification,
    completeVerification,
    handleSendUserId,
    handleVerifyCode,
  } = useNotificationSettings(userId);

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
      if (window.confirm('定要關閉 LINE 通知嗎？這將會清除您的驗證狀態。')) {
        await handleToggle('line');
      }
    }
  };

  const [currentStep, setCurrentStep] = useState(verificationStep);
  const [progress, setProgress] = useState(verificationProgress);

  const handleStepChange = (newStep: VerificationStep) => {
    setCurrentStep(newStep);
    switch (newStep) {
      case VerificationStep.SCAN_QR:
        setProgress(25);
        break;
      case VerificationStep.ADD_FRIEND:
        setProgress(50);
        break;
      case VerificationStep.SEND_ID:
        setProgress(75);
        break;
      case VerificationStep.VERIFY_CODE:
        setProgress(100);
        break;
      default:
        setProgress(0);
    }
    setVerificationStep(newStep);
  };

  const {
    verificationState: lineVerificationState,
    handleVerifyCode: lineHandleVerifyCode
  } = useLineVerification();

  const handleRetry = async () => {
    if (lineVerificationState.retryCount >= LINE_RETRY_COUNT) {
      toast.error('已達最大重試次數，請稍後再試');
      return;
    }

    await lineHandleVerifyCode(verificationCode, userId);
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
                value={formData.email} 
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
              checked={notificationSettings.line}
              onChange={() => handleNotificationChange('line')}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* 驗證流程區域 */}
        {notificationSettings.line && !verificationState.isVerified && (
          <div className="p-6 bg-gray-50">
            {/* 進度條 */}
            <div className="max-w-3xl mx-auto mb-8">
              <div className="relative">
                <div className="absolute top-5 left-0 w-full h-1 bg-gray-200">
                  <div 
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <StepIndicators 
                  currentStep={currentStep}
                  onStepClick={handleStepChange}
                />
              </div>
            </div>

            {/* 步驟內容 */}
            <div className="max-w-2xl mx-auto">
              {currentStep === VerificationStep.SCAN_QR && (
                <QRCodeStep 
                  onNext={() => handleStepChange(VerificationStep.ADD_FRIEND)}
                  onCopyLineId={onCopyLineId}
                />
              )}

              {currentStep === VerificationStep.ADD_FRIEND && (
                <AddFriendStep 
                  onBack={() => handleStepChange(VerificationStep.SCAN_QR)}
                  onNext={() => handleStepChange(VerificationStep.SEND_ID)}
                />
              )}

              {currentStep === VerificationStep.SEND_ID && (
                <SendIdStep 
                  userId={userId}
                  onCopyUserId={onCopyUserId}
                  onBack={() => handleStepChange(VerificationStep.ADD_FRIEND)}
                  onNext={() => handleStepChange(VerificationStep.VERIFY_CODE)}
                  onSendId={handleSendUserId}
                  isLoading={loading}
                />
              )}

              {currentStep === VerificationStep.VERIFY_CODE && (
                <VerifyCodeStep 
                  verificationCode={verificationCode}
                  setVerificationCode={setVerificationCode}
                  onBack={() => handleStepChange(VerificationStep.SEND_ID)}
                  onVerify={() => handleVerifyCode(verificationCode)}
                  isLoading={loading}
                />
              )}
            </div>
          </div>
        )}

        {/* 驗證成功狀態 */}
        {notificationSettings.line && verificationState.isVerified && (
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 
                              text-white flex items-center justify-center shadow-lg">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-2xl" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 text-lg mb-1">LINE 通知已成功啟用</h4>
                <p className="text-gray-600">您現在可以透過 LINE 即時接收所有重要通知</p>
              </div>
              <div className="ml-auto">
                <button 
                  className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
                  onClick={() => {/* 處理重新驗證邏輯 */}}
                >
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <span>重新驗證</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 儲存按鈕區域 */}
      <div className="flex justify-end mt-6 gap-3">
        {/* 只有有變更時才顯示取消按鈕 */}
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