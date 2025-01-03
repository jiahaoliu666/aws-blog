import React, { useState, Dispatch, SetStateAction, useEffect } from 'react';
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
  faCopy,
  faTimes,
  faCheck,
  faStar
} from '@fortawesome/free-solid-svg-icons';
import { faLine, faDiscord } from '@fortawesome/free-brands-svg-icons';
import { Switch } from '@mui/material';
import { useAuthContext } from '@/context/AuthContext';
import { useNotificationSettings } from '@/hooks/profile/useNotificationSettings';
import { toast } from 'react-toastify';
import { VerificationStep, VerificationStatus, VerificationState, VERIFICATION_PROGRESS, type VerificationProgress } from '@/types/lineTypes';
import { useLineVerification } from '@/hooks/line/useLineVerification';
import { LINE_RETRY_COUNT } from '@/config/line';
import { validateVerificationCode } from '@/utils/lineUtils';
import { useToastContext } from '@/context/ToastContext';
import { SectionTitle } from '../common/SectionTitle';
import { Card } from '../common/Card';
import { logger } from '@/utils/logger';

interface NotificationSettings {
  line: boolean;
  email: boolean;
  discord: boolean;
  discordId?: string | null;
  lineId: string | null;
}

interface NotificationSectionProps {
  isLoading: boolean;
  isVerifying: boolean;
  saveAllSettings: () => Promise<void>;
  notificationSettings: {
    line: boolean;
    email: boolean;
    lineId: string | null;
  };
  formData: any;
  handleNotificationChange: (
    type: 'line' | 'email' | 'browser' | 'mobile' | 'push',
    forceValue?: boolean
  ) => Promise<void>;
  lineId?: string;
  setLineId?: (id: string) => void;
  verificationCode: string;
  setVerificationCode: (code: string) => void;
  verificationStep: VerificationStep;
  verificationProgress: number;
  handleStartVerification: () => void;
  handleConfirmVerification: () => void;
  verificationState: VerificationState;
  verifyLineIdAndCode: () => void;
  handleVerification: () => void;
  onCopyUserId: () => void;
  onCopyLineId: () => void;
  userId: string;
  lineOfficialId: string;
  setVerificationStep: (step: VerificationStep) => void;
  handleResetVerification: () => Promise<void>;
  setVerificationState: Dispatch<SetStateAction<VerificationState>>;
  settings: {
    discordId: string | null;
    discordNotification: boolean;
    line: boolean;
    email: boolean;
    lineId: string | null;
  };
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

  // 獲取當前步驟的索引
  const currentStepIndex = steps.findIndex(s => s.step === currentStep);

  return (
    <div className="flex justify-between relative">
      {/* 背景進度條 */}
      <div className="absolute top-6 left-0 w-full h-0.5 bg-gray-200" />
      
      {/* 活動進度條 */}
      <div 
        className="absolute top-6 left-0 h-0.5 bg-green-500 transition-all duration-300"
        style={{ 
          width: `${(currentStepIndex / (steps.length - 1)) * 100}%`
        }} 
      />

      {steps.map(({ step, label, icon }, index) => (
        <div 
          key={step}
          className="relative flex flex-col items-center w-1/4"
        >
          {/* 圓形指示器 */}
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center z-10
            transition-all duration-300 ease-in-out
            ${currentStep === step 
              ? 'bg-green-500 text-white shadow-lg scale-110' 
              : index <= currentStepIndex
                ? 'bg-green-200 text-green-700'
                : 'bg-gray-100 text-gray-400'
            }
          `}>
            <FontAwesomeIcon icon={icon} className="text-lg" />
          </div>
          
          {/* 標籤文字 */}
          <span className={`
            text-sm mt-3 font-medium transition-colors duration-300
            ${currentStep === step ? 'text-green-600' : 'text-gray-500'}
          `}>
            {label}
          </span>
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
            <br />搜尋 ID 加好友
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
      <p className="text-gray-600">請確認您已將官方帳號加為好友</p>
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
  onSendId: (lineId: string) => Promise<boolean>;
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
      <p className="text-gray-600 mb-6">請將以下 ID 複製發送給官方帳號</p>
      
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
        onClick={onNext}
        disabled={isLoading}
        className="bg-green-500 text-white px-6 py-2.5 rounded-lg 
                   hover:bg-green-600 transition-colors 
                   flex items-center gap-2"
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
  isLoading: boolean;
}> = ({ verificationCode, setVerificationCode, onBack, onVerify, isLoading }) => (
  <div className="text-center">
    <div className="bg-white p-8 rounded-xl mb-6">
      <FontAwesomeIcon icon={faShield} className="text-5xl text-green-500 mb-4" />
      <h3 className="text-xl font-semibold mb-3">輸入驗證碼</h3>
      <p className="text-gray-600 mb-4">請輸入官方帳號傳給您的驗證碼</p>
      <input
        type="text"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        placeholder="輸入驗證碼"
        className="w-48 px-4 py-2 border border-gray-200 rounded-lg text-center text-xl tracking-wider mb-4"
        maxLength={6}
      />
      <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
        <FontAwesomeIcon icon={faInfoCircle} />
        <span>驗證碼將在 10 分鐘後失效</span>
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
        disabled={isLoading || !verificationCode || verificationCode.length !== 6}
        className={`
          bg-green-500 text-white px-6 py-2.5 rounded-lg 
          hover:bg-green-600 transition-colors 
          flex items-center gap-2
          ${isLoading || !verificationCode || verificationCode.length !== 6 
            ? 'opacity-50 cursor-not-allowed' 
            : ''}
        `}
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⌛</span>
            驗證中...
          </>
        ) : (
          <>
            <span>驗證</span>
            <FontAwesomeIcon icon={faCheckCircle} />
          </>
        )}
      </button>
    </div>
  </div>
);

const VerificationProgress = ({ step, status }: { step: VerificationStep; status: VerificationStatus }) => {
  const steps = [
    { key: 'SCAN_QR', label: '掃描 QR Code', icon: '📱' },
    { key: 'VERIFYING', label: '輸入驗證碼', icon: '🔑' },
    { key: 'COMPLETED', label: '完成驗證', icon: '✅' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="mt-4 mb-6">
      {/* 進度條標題 */}
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-lg font-medium">LINE 驗證進度</h4>
        <span className="text-sm text-gray-500">
          {currentStepIndex + 1} / {steps.length}
        </span>
      </div>

      {/* 進度條主體 */}
      <div className="relative">
        {/* 背景線 */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2" />
        
        {/* 進度線 */}
        <div 
          className="absolute top-1/2 left-0 h-1 bg-blue-500 -translate-y-1/2 transition-all duration-500"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        />

        {/* 步驟點 */}
        <div className="relative flex justify-between">
          {steps.map((s, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            
            return (
              <div key={s.key} className="flex flex-col items-center">
                {/* 步驟圖示 */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300 relative z-10
                    ${isCompleted ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}
                    ${isCurrent ? 'ring-4 ring-blue-100' : ''}
                  `}
                >
                  <span className="text-lg">{s.icon}</span>
                </div>
                
                {/* 步驟標籤 */}
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-600'}`}>
                    {s.label}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-gray-500 mt-1">
                      {status === VerificationStatus.VALIDATING ? '理...' : 
                       status === VerificationStatus.SUCCESS ? '成功' : 
                       status === VerificationStatus.ERROR ? '發生錯誤' : '等待中'}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 提示訊息 */}
      {status === VerificationStatus.ERROR && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          驗證過程發生錯誤，請重新嘗試或聯繫客服支援
        </div>
      )}
      
      {status === VerificationStatus.PENDING && step === 'VERIFYING' && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-600 rounded-lg text-sm">
          請在 10 分鐘內完成驗證，驗證碼已發送至您的 LINE
        </div>
      )}
    </div>
  );
};

const DiscordVerificationStep: React.FC<{
  onVerify: (discordId: string) => Promise<boolean>;
  onCancel: () => void;
  isLoading: boolean;
}> = ({ onVerify, onCancel, isLoading }) => {
  const [discordId, setDiscordId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (discordId) {
      await onVerify(discordId);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Discord 驗證</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discord ID
          </label>
          <input
            type="text"
            value={discordId}
            onChange={(e) => setDiscordId(e.target.value)}
            placeholder="請輸入您的 Discord ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isLoading || !discordId}
            className={`
              px-4 py-2 rounded-md
              ${isLoading || !discordId
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }
            `}
          >
            {isLoading ? '驗證中...' : '確認'}
          </button>
        </div>
      </form>
    </div>
  );
};

const NotificationSectionUI: React.FC<NotificationSectionProps> = ({
  isLoading: propIsLoading,
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
  handleResetVerification,
  setVerificationState,
  settings: propSettings,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuthContext();
  const {
    settings,
    setSettings,
    isLoading: settingsLoading,
    showVerification,
    startVerification,
    hasChanges,
    handleSettingChange: handleToggle,
    saveSettings,
    resetSettings,
    handleSendUserId,
    handleVerifyCode,
    reloadSettings,
    cancelVerification,
    isDiscordVerifying,
    setIsDiscordVerifying,
    showDiscordVerification,
    setShowDiscordVerification,
    startDiscordVerification,
    cancelDiscordVerification,
    handleDiscordVerificationComplete,
    handleDiscordToggle,
    startDiscordAuth
  } = useNotificationSettings(userId);

  const isPageLoading = propIsLoading || settingsLoading;

  const handleSave = async () => {
    if (!hasChanges) {
      return;
    }
    
    const success = await saveSettings();
    if (success) {
      // Toast 通知會由 useNotificationSettings 處理
      // 頁面刷新也會由 hook 處理
      return;
    }
  };

  const handleEmailToggle = () => {
    // 檢查是否有未儲存的變更
    if (hasChanges) {
      showToast('請先儲存或取消目前的變更，再切換電子郵件通知設定', 'warning');
      return;
    }

    // 檢查是否有其他通知已開啟
    if (!settings.emailNotification && (settings.lineNotification || settings.discordNotification)) {
      showToast('您已開啟其他通知方式，請先關閉後再開啟電子郵件通知', 'warning');
      return;
    }

    const newValue = !settings.emailNotification;
    handleToggle('email', newValue);
    setSettings(prev => ({
      ...prev,
      emailNotification: newValue,
    }));
  };

  const handleLineToggle = async () => {
    try {
      // 檢查是否有未儲存的變更
      if (hasChanges) {
        showToast('請先儲存或取消目前的變更，再切換 LINE 通知設定', 'warning');
        return;
      }

      // 檢查是否有其他通知已開啟
      if (!settings.lineNotification && (settings.emailNotification || settings.discordNotification)) {
        showToast('您已開啟其他通知方式，請先關閉後再開啟 LINE 通知', 'warning');
        return;
      }

      if (!settings.lineNotification) {
        const wasChanged = await handleToggle('lineNotification', true);
        if (wasChanged) {
          setVerificationStep(VerificationStep.SCAN_QR);
          setProgress(VERIFICATION_PROGRESS.INITIAL);
        }
      } else {
        if (settings.lineId) {
          if (window.confirm('確定關閉 LINE 通知嗎？這將會清除您的驗證狀態。')) {
            await handleToggle('lineNotification', false);
          }
        }
      }
    } catch (error) {
      console.error('切換 LINE 通知失敗:', error);
      showToast('LINE 通知設定更新失敗，請稍後再試', 'error');
    }
  };

  const [currentStep, setCurrentStep] = useState(verificationStep);
  const [progress, setProgress] = useState<VerificationProgress>(VERIFICATION_PROGRESS.INITIAL);

  const handleStepChange = (newStep: VerificationStep) => {
    // 如果當前步驟是驗證碼確認，且要切換到其他步驟，則清空驗證碼
    if (currentStep === VerificationStep.VERIFY_CODE && newStep !== VerificationStep.VERIFY_CODE) {
      setVerificationCode('');
    }

    setCurrentStep(newStep);
    switch (newStep) {
      case VerificationStep.SCAN_QR:
        setProgress(VERIFICATION_PROGRESS.SCAN_QR);
        break;
      case VerificationStep.ADD_FRIEND:
        setProgress(VERIFICATION_PROGRESS.ADD_FRIEND);
        break;
      case VerificationStep.SEND_ID:
        setProgress(VERIFICATION_PROGRESS.SEND_ID);
        break;
      case VerificationStep.VERIFY_CODE:
        setProgress(VERIFICATION_PROGRESS.VERIFY_CODE);
        break;
      default:
        setProgress(VERIFICATION_PROGRESS.INITIAL);
    }
    setVerificationStep(newStep);
  };

  const {
    verificationState: lineVerificationState,
    handleVerifyCode: lineHandleVerifyCode
  } = useLineVerification();

  const handleRetry = async () => {
    if (lineVerificationState.retryCount >= LINE_RETRY_COUNT) {
      toast.error('已達最大重試數，請後再試');
      return;
    }

    await lineHandleVerifyCode(verificationCode, userId);
  };

  useEffect(() => {
    console.log('當前設定狀態:', settings);
    console.log('載入狀態:', settingsLoading);
  }, [settings, settingsLoading]);

  const toast = useToastContext();

  const onVerify = async () => {
    try {
      setIsLoading(true);

      // 驗證碼格式檢查
      if (!verificationCode || verificationCode.length !== 6) {
        toast.error('請輸入6位數驗證碼');
        return;
      }

      const result = await lineHandleVerifyCode(verificationCode, userId);
      
      if (result.success) {
        toast.success('驗證成功');
        setVerificationStep(VerificationStep.COMPLETED);
        await reloadSettings();
      } else {
        toast.error(result.message || '驗證失敗');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '驗證失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const LINE_OFFICIAL_ID = '@601feiwz'; // 可以移到配置文件中

  const handleCopyLineId = () => {
    try {
      navigator.clipboard.writeText(LINE_OFFICIAL_ID);
      toast.success('已複製 LINE ID ', {
        position: 'top-right',
        duration: 3000
      });
    } catch (error) {
      toast.error('複製失敗，請手動複製', {
        position: 'top-right',
        duration: 3000
      });
      console.error('複製 LINE ID 失敗:', error);
    }
  };

  const handleDiscordSwitch = (checked: boolean) => {
    // 檢查是否有未儲存的變更
    if (hasChanges) {
      showToast('請先儲存或取消目前的變更，再切換 Discord 通知設定', 'warning');
      return;
    }

    // 檢查是否有其他通知已開啟
    if (checked && (settings.emailNotification || settings.lineNotification)) {
      showToast('您已開啟其他通知方式，請先關閉後再開啟 Discord 通知', 'warning');
      return;
    }

    if (!checked) {
      // 當要關閉 Discord 通知時，顯示確認對話框
      if (window.confirm('確定要關閉 Discord 通知嗎？這將會清除所有的通知設定。')) {
        handleDiscordToggle(checked);
      }
    } else {
      handleDiscordToggle(checked);
    }
  };

  const { showToast } = useToastContext();

  useEffect(() => {
    const handleDiscordAuthMessage = (event: MessageEvent) => {
      if (event.data.type === 'DISCORD_AUTH_SUCCESS') {
        if (isDiscordVerifying) {
          setSettings(prev => ({
            ...prev,
            discordId: event.data.discord_id,
            discordNotification: true
          }));
          setShowDiscordVerification(false);
          setIsDiscordVerifying(false);
          
          // Toast 通知和頁面刷新會由 useNotificationSettings 處理
        }
      } else if (event.data.type === 'DISCORD_AUTH_ERROR') {
        if (isDiscordVerifying) {
          showToast(event.data.error || 'Discord 綁定失敗', 'error');
          setIsDiscordVerifying(false);
          logger.error('Discord 授權失敗:', event.data.error);
        }
      }
    };

    window.addEventListener('message', handleDiscordAuthMessage);
    return () => window.removeEventListener('message', handleDiscordAuthMessage);
  }, [isDiscordVerifying]);

  const handleDiscordAuth = async () => {
    try {
      // 檢查是否有未儲存的變更
      if (hasChanges) {
        showToast('請先儲存或取消目前的變更，再開始 Discord 驗證', 'warning');
        return null;
      }

      // 檢查是否有其他通知已開啟
      if (settings.emailNotification || settings.lineNotification) {
        showToast('您已開啟其他通知方式，請先關閉後再開始 Discord 驗證', 'warning');
        return null;
      }

      // 開啟授權視窗並獲取其引用
      const authWindow = await startDiscordAuth(userId);
      
      // 如果視窗開啟失敗，直接返回
      if (!authWindow) {
        return null;
      }

      // 監聽視窗關閉事件
      const checkWindow = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkWindow);
          // 如果視窗被關閉且尚未完成授權，重置狀態
          setIsDiscordVerifying(false);
        }
      }, 500);

      // 設置一個超時計時器，如果 30 秒內沒有收到回應，就重置狀態
      const timeoutId = setTimeout(() => {
        if (isDiscordVerifying) {
          setIsDiscordVerifying(false);
          clearInterval(checkWindow);
          showToast('Discord 授權超時，請重試', 'error');
        }
      }, 30000);

      // 清理函數
      return () => {
        clearInterval(checkWindow);
        clearTimeout(timeoutId);
      };
    } catch (error) {
      setIsDiscordVerifying(false);
      showToast('Discord 授權失敗', 'error');
      console.error('Discord 授權失敗:', error);
      return null;
    }
  };

  const handleStartLineVerification = () => {
    // 檢查是否有未儲存的變更
    if (hasChanges) {
      showToast('請先儲存或取消目前的變更，再開始 LINE 驗證', 'warning');
      return;
    }
    
    // 檢查是否有其他通知已開啟
    if (settings.emailNotification || settings.discordNotification) {
      showToast('您已開啟其他通知方式，請先關閉後再開始 LINE 驗證', 'warning');
      return;
    }

    startVerification();
    setVerificationStep(VerificationStep.SCAN_QR);
    setCurrentStep(VerificationStep.SCAN_QR);
  };

  const handleCancelVerification = () => {
    setVerificationCode(''); // 清空驗證碼
    cancelVerification();
  };

  return (
    <div className="w-full">
      {/* 如果正在進行驗證，顯示驗證介面 */}
      {showVerification ? (
        <div className="mb-8 relative">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">LINE 驗證</h2>
            <p className="text-gray-600">請依照以下步驟完成 LINE 驗證</p>
          </div>

          {/* 步驟指示器 */}
          <StepIndicators 
            currentStep={currentStep} 
            onStepClick={handleStepChange} 
          />

          {/* 驗證步驟內容 */}
          <div className="mt-8">
            {currentStep === VerificationStep.SCAN_QR && (
              <QRCodeStep 
                onNext={() => handleStepChange(VerificationStep.ADD_FRIEND)} 
                onCopyLineId={handleCopyLineId}
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
                onSendId={(lineId: string) => handleSendUserId(lineId)}
                isLoading={isLoading}
              />
            )}
            
            {currentStep === VerificationStep.VERIFY_CODE && (
              <VerifyCodeStep 
                verificationCode={verificationCode}
                setVerificationCode={setVerificationCode}
                onBack={() => handleStepChange(VerificationStep.SEND_ID)}
                onVerify={onVerify}
                isLoading={isLoading}
              />
            )}
          </div>

          {/* 取消按鈕 - 調整樣式讓它更明顯 */}
          <button
            onClick={handleCancelVerification}
            className="absolute top-0 right-0 p-2 rounded-full
                       hover:bg-gray-100 text-gray-500 hover:text-gray-700
                       transition-all duration-200 flex items-center gap-2"
            title="取消驗證"
          >
            <span className="text-sm">取消</span>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      ) : (
        // 原有的通知設定介面
        <>
          <div className="mb-8">
            <SectionTitle 
              title="通知設定"
              description="選擇您習慣的接收方式 (僅限一種)"
            />
          </div>

          <div className="space-y-6">
            {/* 電子郵件通知卡片 */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                      <FontAwesomeIcon 
                        icon={faEnvelope} 
                        className="text-xl text-blue-500"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">電子郵件通知</h3>
                      <p className="text-sm text-gray-600">透過 Mail 接收即時通知</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 
                          text-blue-700 text-xs font-medium rounded-full border border-blue-200
                          shadow-sm shadow-blue-100/50">
                          <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                          已綁定
                        </span>
                        <span className="text-xs text-gray-500">{formData.email}</span>
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={settings.emailNotification}
                    onChange={handleEmailToggle}
                    disabled={isPageLoading}
                    sx={{
                      '& .MuiSwitch-switchBase': {
                        color: '#9ca3af',
                        '&:hover': {
                          backgroundColor: 'rgba(37, 99, 235, 0.04)',
                        },
                        '&.Mui-checked': {
                          color: '#2563eb',
                          '&:hover': {
                            backgroundColor: 'rgba(37, 99, 235, 0.04)',
                          },
                          '& + .MuiSwitch-track': {
                            backgroundColor: '#2563eb !important',
                            opacity: '0.5 !important',
                          },
                          '&.Mui-disabled': {
                            color: '#93c5fd',
                          },
                        },
                      },
                      '& .MuiSwitch-track': {
                        backgroundColor: '#d1d5db',
                        opacity: 0.3,
                      },
                    }}
                  />
                </div>
              </div>
            </Card>

            {/* LINE 通知卡片 */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                      <FontAwesomeIcon 
                        icon={faLine} 
                        className="text-xl text-green-500"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">LINE 通知</h3>
                      <p className="text-sm text-gray-600">透過 LINE 接收即時通知</p>
                      {settings.lineId ? (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 
                            text-green-700 text-xs font-medium rounded-full border border-green-200
                            shadow-sm shadow-green-100/50">
                            <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                            已綁定
                          </span>
                          <span className="text-xs text-gray-500">
                            LINE ID: {settings.lineId}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-50 
                            text-gray-500 text-xs font-medium rounded-full border border-gray-200">
                            未綁定
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={settings.lineNotification}
                    onChange={handleLineToggle}
                    disabled={!settings.lineId}
                    sx={{
                      '& .MuiSwitch-switchBase': {
                        color: '#9ca3af',
                        '&:hover': {
                          backgroundColor: 'rgba(37, 99, 235, 0.04)',
                        },
                        '&.Mui-checked': {
                          color: '#2563eb',
                          '&:hover': {
                            backgroundColor: 'rgba(37, 99, 235, 0.04)',
                          },
                          '& + .MuiSwitch-track': {
                            backgroundColor: '#2563eb',
                            opacity: 0.5,
                          },
                        },
                        '&.Mui-disabled': {
                          color: '#e5e7eb',
                        },
                      },
                      '& .MuiSwitch-track': {
                        backgroundColor: '#d1d5db',
                        opacity: 0.3,
                      },
                    }}
                  />
                </div>
              </div>

              {/* LINE 驗證流程區域 */}
              {!settings.lineId && !settings.lineNotification && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">需要先完成 LINE 驗證才能啟用通知功能</p>
                    <button
                      onClick={handleStartLineVerification}
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-lg 
                        hover:bg-blue-700 active:bg-blue-800
                        transition-all duration-200 ease-in-out
                        flex items-center gap-2 mx-auto
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <FontAwesomeIcon icon={faLine} />
                      開始 LINE 驗證
                    </button>
                  </div>
                </div>
              )}
            </Card>

            {/* Discord 通知卡片 */}
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <FontAwesomeIcon 
                        icon={faDiscord} 
                        className="text-xl text-indigo-500"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 relative">
                        Discord 通知
                        <span className="relative group cursor-help">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 
                            bg-gradient-to-r from-green-500 to-green-600 
                            text-white text-xs font-bold rounded-full 
                            shadow-sm hover:shadow-md
                            transition-all duration-200">
                            <FontAwesomeIcon icon={faStar} className="text-yellow-300 text-[10px]" />
                            推薦使用
                          </span>
                          <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2
                            w-max px-4 py-2.5 text-sm text-white 
                            bg-gray-800/95 rounded-xl opacity-0 group-hover:opacity-100 
                            transition-all duration-200 ease-in-out scale-0 group-hover:scale-100
                            shadow-xl backdrop-blur-sm pointer-events-none z-50">
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <FontAwesomeIcon icon={faInfoCircle} className="text-green-400" />
                              <span>此功能完全免費，推薦使用 Discord 接收通知！</span>
                            </div>
                            <div className="absolute top-1/2 -left-1 transform -translate-y-1/2
                              w-2 h-2 bg-gray-800/95 rotate-45">
                            </div>
                          </div>
                        </span>
                      </h3>
                      <p className="text-sm text-gray-600">透過 Discord 接收即時通知</p>
                      
                      {/* 狀態標籤區域 */}
                      <div className="mt-2 flex items-center gap-2">
                        {settings.discordId ? (
                          <>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 
                              bg-indigo-50 text-indigo-700 text-xs font-medium 
                              rounded-full border border-indigo-200">
                              <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                              已綁定
                            </span>
                            <span className="text-xs text-gray-500">
                              Discord ID: {settings.discordId}
                            </span>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 
                            bg-gray-50 text-gray-500 text-xs font-medium 
                            rounded-full border border-gray-200">
                            未綁定
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Discord 通知開關 */}
                  <Switch
                    checked={settings.discordNotification}
                    onChange={(_, checked) => handleDiscordSwitch(checked)}
                    disabled={!settings.discordId}
                    sx={{
                      '& .MuiSwitch-switchBase': {
                        color: '#9ca3af',
                        '&:hover': {
                          backgroundColor: 'rgba(79, 70, 229, 0.04)',
                        },
                        '&.Mui-checked': {
                          color: '#4f46e5',
                          '&:hover': {
                            backgroundColor: 'rgba(79, 70, 229, 0.04)',
                          },
                          '& + .MuiSwitch-track': {
                            backgroundColor: '#4f46e5',
                            opacity: 0.5,
                          },
                        },
                        '&.Mui-disabled': {
                          color: '#e5e7eb',
                        },
                      },
                      '& .MuiSwitch-track': {
                        backgroundColor: '#d1d5db',
                        opacity: 0.3,
                      },
                    }}
                  />
                </div>
              </div>

              {/* Discord 驗證流程區域 - 只在未綁定且未啟用通知時顯示 */}
              {!settings.discordId && !settings.discordNotification && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">需要先完成 Discord 驗證才能啟用通知功能</p>
                    <button
                      onClick={handleDiscordAuth}
                      className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg 
                        hover:bg-indigo-700 active:bg-indigo-800
                        transition-all duration-200 ease-in-out
                        flex items-center gap-2 mx-auto
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      disabled={isDiscordVerifying}
                    >
                      <FontAwesomeIcon icon={faDiscord} />
                      {isDiscordVerifying ? '授權中...' : '使用 Discord 登入'}
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* 儲存按鈕區域 */}
          <div className="flex justify-end mt-6 gap-3">
            {hasChanges && (
              <button
                onClick={resetSettings}
                className="px-6 py-2.5 rounded-lg text-gray-700 border border-gray-200
                  hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                取消
              </button>
            )}
            
            <button
              onClick={saveSettings}
              disabled={isSaving || !hasChanges}
              className={`
                px-6 py-2.5 rounded-lg flex items-center gap-2
                ${isSaving || !hasChanges 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                }
                transition-all duration-200
              `}
            >
              {isSaving ? (
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
        </>
      )}

      {showDiscordVerification && (
        <DiscordVerificationStep
          onVerify={handleDiscordVerificationComplete}
          onCancel={cancelDiscordVerification}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default NotificationSectionUI;