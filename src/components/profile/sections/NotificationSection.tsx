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
  faExclamationTriangle
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
  setVerificationStep: (step: VerificationStep) => void;
}

interface StepIndicatorsProps {
  currentStep: VerificationStep;
  onStepClick: (step: VerificationStep) => void;
}

const StepIndicators: React.FC<StepIndicatorsProps> = ({ currentStep, onStepClick }) => {
  const steps = [
    { step: VerificationStep.SCAN_QR, label: '掃描 QR Code' },
    { step: VerificationStep.ADD_FRIEND, label: '加入好友' },
    { step: VerificationStep.SEND_ID, label: '發送 ID' },
    { step: VerificationStep.VERIFY_CODE, label: '驗證碼確認' }
  ];

  return (
    <div className="flex justify-between">
      {steps.map(({ step, label }) => (
        <div 
          key={step}
          className={`relative flex flex-col items-center cursor-pointer`}
          onClick={() => onStepClick(step)}
        >
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center z-10
            ${currentStep === step ? 'bg-green-500 text-white' : 'bg-gray-200'}
          `}>
            {step + 1}
          </div>
          <span className="text-sm mt-2">{label}</span>
        </div>
      ))}
    </div>
  );
};

interface StepProps {
  onBack?: () => void;
  onNext?: () => void;
}

const QRCodeStep: React.FC<StepProps> = ({ onNext }) => (
  <div className="text-center">
    <div className="bg-white p-8 rounded-xl shadow-sm inline-block mb-6">
      <img 
        src="/images/line-qrcode.png" 
        alt="LINE QR Code" 
        width={200} 
        height={200} 
      />
    </div>
    <h3 className="text-xl font-semibold mb-3">掃描 QR Code</h3>
    <p className="text-gray-600 mb-6">請使用 LINE 應用程式掃描上方的 QR Code</p>
    <button
      onClick={onNext}
      className="bg-green-500 text-white px-6 py-2.5 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 mx-auto"
    >
      <span>下一步</span>
      <FontAwesomeIcon icon={faArrowRight} />
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

const SendIdStep: React.FC<StepProps & { userId: string; onCopyUserId: () => void }> = ({ 
  onBack, 
  onNext, 
  userId,
  onCopyUserId 
}) => (
  <div className="text-center">
    <div className="bg-white p-8 rounded-xl mb-6">
      <FontAwesomeIcon icon={faPaperPlane} className="text-5xl text-green-500 mb-4" />
      <h3 className="text-xl font-semibold mb-3">發送您的用戶 ID</h3>
      <p className="text-gray-600 mb-4">請將以下 ID 複製並發送給官方帳號</p>
      <div className="flex items-center justify-center gap-2 mb-4">
        <code className="bg-gray-100 px-4 py-2 rounded-lg">{userId}</code>
        <button
          onClick={onCopyUserId}
          className="p-2 text-gray-500 hover:text-gray-700"
          title="複製 ID"
        >
          <FontAwesomeIcon icon={faQrcode} />
        </button>
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
        onClick={onNext}
        className="bg-green-500 text-white px-6 py-2.5 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
      >
        <span>下一步</span>
        <FontAwesomeIcon icon={faArrowRight} />
      </button>
    </div>
  </div>
);

const VerifyCodeStep: React.FC<{
  verificationCode: string;
  setVerificationCode: (code: string) => void;
  onBack: () => void;
  onVerify: () => void;
}> = ({ verificationCode, setVerificationCode, onBack, onVerify }) => (
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
  userId,
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
                />
              )}

              {currentStep === VerificationStep.VERIFY_CODE && (
                <VerifyCodeStep 
                  verificationCode={verificationCode}
                  setVerificationCode={setVerificationCode}
                  onBack={() => handleStepChange(VerificationStep.SEND_ID)}
                  onVerify={handleVerification}
                />
              )}
            </div>
          </div>
        )}

        {/* 驗證成功狀態 */}
        {notificationSettings.line && verificationState.isVerified && (
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