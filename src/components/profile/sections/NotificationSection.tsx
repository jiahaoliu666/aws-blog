import React, { useState, Dispatch, SetStateAction, useEffect, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
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
  faStar,
  faClock
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
import { Dialog } from '@mui/material';

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
    lineNotification: boolean;
    emailNotification: boolean;
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
          className="relative flex flex-col items-center w-1/3"
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
}) => {
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateVerificationCode = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch('/api/line/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      if (data.success) {
        setVerificationCode(data.verificationCode);
      } else {
        toast.error(data.message || '生成驗證碼失敗');
      }
    } catch (error) {
      toast.error('生成驗證碼失敗，請稍後再試');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="text-center">
      <div className="bg-white p-8 rounded-xl mb-6">
        <FontAwesomeIcon icon={faPaperPlane} className="text-5xl text-green-500 mb-4" />
        <h3 className="text-xl font-semibold mb-3">驗證碼</h3>
        
        {!verificationCode ? (
          <>
            <p className="text-gray-600 mb-6">點擊下方按鈕生成驗證碼</p>
            <button
              onClick={generateVerificationCode}
              disabled={isGenerating}
              className={`
                px-6 py-3 rounded-lg text-white
                ${isGenerating ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}
                transition-colors duration-200
                flex items-center gap-2 mx-auto
              `}
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin">⌛</span>
                  生成中...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faShield} />
                  生成驗證碼
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-4">請將此驗證碼輸入至 LINE 官方帳號</p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="relative group">
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-3 pr-12
                              font-mono text-2xl text-gray-700 tracking-wider select-all">
                  {verificationCode}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(verificationCode);
                    toast.success('已複製驗證碼');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2
                           p-2 rounded-md hover:bg-gray-100 
                           text-gray-500 hover:text-gray-700
                           transition-all duration-200"
                  title="複製驗證碼"
                >
                  <FontAwesomeIcon icon={faCopy} className="text-lg" />
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500 flex items-center justify-center gap-2 mb-4">
              <FontAwesomeIcon icon={faInfoCircle} />
              <span>驗證碼將在 5 分鐘後失效</span>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={onBack}
          disabled={isGenerating}
          className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg 
                   hover:bg-gray-200 transition-colors"
        >
          返回
        </button>
        <button
          onClick={onNext}
          disabled={isGenerating || !verificationCode}
          className={`
            bg-green-500 text-white px-6 py-2.5 rounded-lg 
            hover:bg-green-600 transition-colors 
            flex items-center gap-2
            ${(isGenerating || !verificationCode) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <span>下一步</span>
          <FontAwesomeIcon icon={faArrowRight} />
        </button>
      </div>
    </div>
  );
};

const VerifyCodeStep: React.FC<{
  verificationCode: string;
  setVerificationCode: (code: string) => void;
  onBack: () => void;
  onVerify: () => void;
  isLoading: boolean;
  userId: string;
  onCancel: () => void;
}> = ({ 
  verificationCode, 
  setVerificationCode, 
  onBack, 
  onVerify, 
  isLoading, 
  userId,
  onCancel 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'back' | 'cancel'>('back');

  // 添加輪詢機制檢查驗證狀態
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (generatedCode) {
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/line/verification-status?userId=${userId}`);
          const data = await response.json();
          
          if (data.success && data.isVerified) {
            // 清除輪詢
            clearInterval(pollInterval);
            // 顯示成功訊息
            toast.success('LINE 驗證成功！');
            // 重新載入頁面
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }
        } catch (error) {
          logger.error('檢查驗證狀態失敗:', error);
        }
      }, 3000); // 每 3 秒檢查一次
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [generatedCode, userId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft]);

  const generateVerificationCode = async () => {
    try {
      setIsGenerating(true);
      setGeneratedCode('');
      setTimeLeft(0);

      const response = await fetch('/api/line/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedCode(data.verificationCode);
        const remainingTime = Math.floor((data.expiryTime - Date.now()) / 1000);
        setTimeLeft(remainingTime);
        toast.success('已生成新的驗證碼');
      } else {
        toast.error(data.message || '生成驗證碼失敗');
      }
    } catch (error) {
      toast.error('生成驗證碼失敗，請稍後再試');
      logger.error('生成驗證碼失敗:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (timeLeft === 0 && generatedCode) {
      setGeneratedCode('');
    }
  }, [timeLeft, generatedCode]);

  const handleBack = () => {
    if (generatedCode) {
      setDialogType('back');
      setShowConfirmDialog(true);
    } else {
      onBack();
    }
  };

  const handleCancelVerification = () => {
    if (generatedCode) {
      setDialogType('cancel');
      setShowConfirmDialog(true);
    } else {
      onCancel();
    }
  };

  const handleConfirmAction = () => {
    setShowConfirmDialog(false);
    setGeneratedCode('');
    setTimeLeft(0);
    if (dialogType === 'back') {
      onBack();
    } else {
      onCancel();
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg mb-6 border border-gray-100">
        <div className="flex flex-col items-center justify-center">
          <div className="mb-6 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 mx-auto">
              <FontAwesomeIcon icon={faShield} className="text-2xl text-green-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">驗證確認</h3>
            <p className="text-gray-600">
              {!generatedCode ? '請點擊下方按鈕生成驗證碼' : '請將驗證碼輸入至 LINE 官方帳號'}
            </p>
          </div>

          <div className="w-full max-w-md">
            {!generatedCode ? (
              <button
                onClick={generateVerificationCode}
                disabled={isGenerating}
                className={`
                  max-w-[280px] mx-auto bg-green-500 text-white px-6 py-3.5 rounded-xl
                  text-base font-medium
                  hover:bg-green-600 active:bg-green-700
                  transition-all duration-300 
                  shadow-sm hover:shadow
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                  flex items-center justify-center gap-2
                `}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⌛</span>
                    <span>生成驗證碼中...</span>
                  </span>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faShield} className="text-lg" />
                    <span>生成驗證碼</span>
                  </>
                )}
              </button>
            ) : (
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2
                              bg-green-500 text-white px-4 py-1 rounded-full text-sm">
                  驗證碼
                </div>
                
                <div className="mt-2 mb-4">
                  <div className="text-4xl font-mono font-bold text-gray-800 tracking-[0.5em]
                                flex items-center justify-center gap-4 relative group">
                    {generatedCode}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCode);
                        toast.success('已複製驗證碼');
                      }}
                      className="ml-2 p-2 text-gray-400 
                               hover:text-gray-600 transition-colors rounded-lg
                               hover:bg-gray-100 group-hover:opacity-100
                               focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      title="複製驗證碼"
                    >
                      <FontAwesomeIcon icon={faCopy} />
                    </button>
                  </div>
                </div>

                {timeLeft > 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <FontAwesomeIcon icon={faClock} className="text-green-500" />
                    <span className="font-mono">
                      剩餘時間：{formatTime(timeLeft)}
                    </span>
                  </div>
                )}
                
                {timeLeft === 0 && (
                  <div className="text-red-500 text-sm mt-2">
                    驗證碼已過期，請重新生成
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={handleBack}
          className="px-6 py-2.5 rounded-lg text-gray-700 bg-gray-100
                   hover:bg-gray-200 active:bg-gray-300
                   transition-all duration-200
                   flex items-center gap-2
                   focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          返回上一步
        </button>
      </div>

      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            確認返回
          </h3>
          <p className="text-gray-600 mb-6">
            返回後需要重新發送驗證碼才能繼續流程，確定要返回嗎？
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setShowConfirmDialog(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirmAction}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              確認
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

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

interface VerificationResult {
  success: boolean;
  message?: string;
}

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
  const toast = useToastContext();

  // 保留原有的狀態管理
  const {
    settings,
    setSettings,
    isLoading: settingsLoading,
    showVerification,
    startVerification,
    handleSendUserId,
    handleVerifyCode,
    cancelVerification,
    isDiscordVerifying,
    setIsDiscordVerifying,
    showDiscordVerification,
    setShowDiscordVerification,
    handleDiscordVerificationComplete,
    startDiscordAuth,
  } = useNotificationSettings(userId);

  // 新增本地狀態來追蹤設定變更
  const [localSettings, setLocalSettings] = useState({
    emailNotification: settings?.emailNotification || false,
    lineNotification: settings?.lineNotification || false,
    discordNotification: settings?.discordNotification || false,
  });

  // 當 settings 變化時更新本地狀態
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        emailNotification: settings.emailNotification || false,
        lineNotification: settings.lineNotification || false,
        discordNotification: settings.discordNotification || false,
      });
    }
  }, [settings]);

  // 追蹤是否有未儲存的變更
  const hasUnsavedChanges = useMemo(() => {
    if (!settings) return false;
    
    return (
      localSettings.emailNotification !== settings.emailNotification ||
      localSettings.lineNotification !== settings.lineNotification ||
      localSettings.discordNotification !== settings.discordNotification
    );
  }, [localSettings, settings]);

  // 重置為初始狀態
  const handleReset = useCallback(() => {
    if (settings) {
      setLocalSettings({
        emailNotification: settings.emailNotification || false,
        lineNotification: settings.lineNotification || false,
        discordNotification: settings.discordNotification || false,
      });
      toast.info('已重置所有設定');
    }
  }, [settings]);

  // 處理切換按鈕
  const handleToggle = useCallback((type: 'email' | 'line' | 'discord') => {
    setLocalSettings(prev => {
      const newSettings = { ...prev };
      
      // 檢查是否有未儲存的 LINE 設定變更
      if (type !== 'line' && 
          prev.lineNotification !== settings.lineNotification) {
        toast.warning('請先儲存或取消目前的變更，再開始電子郵件驗證');
        return prev;
      }

      // 檢查是否有其他通知已開啟
      const otherNotificationsEnabled = Object.entries(newSettings)
        .filter(([key]) => key !== `${type}Notification`)
        .some(([_, value]) => value);

      // 如果要開啟新的通知，且已有其他通知開啟
      if (!newSettings[`${type}Notification`] && otherNotificationsEnabled) {
        toast.warning('您已開啟其他通知方式，請先關閉後再開啟新的通知');
        return prev;
      }

      newSettings[`${type}Notification`] = !newSettings[`${type}Notification`];
      return newSettings;
    });
  }, [settings]);

  // 儲存設定
  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      return;
    }

    try {
      setIsSaving(true);
      
      // 確保有 userId
      if (!userId) {
        throw new Error('使用者 ID 不存在');
      }

      // 根據選擇的通知類型構建請求資料
      let requestData = {
        userId,
        emailNotification: localSettings.emailNotification,
        email: formData.email,
        discordNotification: localSettings.discordNotification,
        discordId: settings.discordId,
        lineNotification: localSettings.lineNotification,
        lineId: settings.lineId,
        lineUserId: settings.lineUserId
      };

      const response = await fetch('/api/profile/notification-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('儲存設定失敗:', errorData);
        throw new Error(errorData?.error || '儲存設定失敗');
      }

      const data = await response.json();
      
      if (data.success) {
        // 更新全局設定狀態
        setSettings(prev => ({
          ...prev,
          email: data.settings.emailNotification,
          line: data.settings.lineNotification,
          discordNotification: data.settings.discordNotification,
          lineId: data.settings.lineId,
          lineUserId: data.settings.lineUserId,
          discordId: data.settings.discordId,
        }));

        toast.success('設定已成功儲存');
        
        // 延遲 1 秒後重整頁面，讓使用者能看到成功訊息
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(data.message || '儲存設定失敗');
      }
    } catch (error) {
      console.error('儲存設定失敗:', error);
      toast.error(error instanceof Error ? error.message : '儲存設定失敗，請稍後再試');
      
      // 儲存失敗時重置為初始狀態
      handleReset();
    } finally {
      setIsSaving(false);
    }
  };

  // 更新 Switch 組件的處理函數
  const handleEmailToggle = () => handleToggle('email');
  const handleLineToggle = () => handleToggle('line');
  const handleDiscordToggle = () => handleToggle('discord');

  // 驗證相關狀態
  const [currentStep, setCurrentStep] = useState(verificationStep);
  const [progress, setProgress] = useState<VerificationProgress>(VERIFICATION_PROGRESS.INITIAL);

  const handleStepChange = (newStep: VerificationStep) => {
    setCurrentStep(newStep);
    setVerificationStep(newStep);
  };

  const handleStartLineVerification = () => {
    if (hasUnsavedChanges) {
      toast.warning('請先儲存或取消目前的變更，再開始 LINE 驗證');
      return;
    }

    // 檢查是否已開啟 Discord 通知
    if (settings?.discordNotification || localSettings.discordNotification) {
      toast.warning('您已開啟其他通知方式，請先關閉後再開啟新的通知');
      return;
    }

    // 檢查是否已開啟電子郵件通知
    if (settings?.emailNotification) {
      toast.warning('您已開啟電子郵件通知，請先關閉後再進行 LINE 驗證');
      return;
    }
    
    startVerification();
    setVerificationStep(VerificationStep.SCAN_QR);
    setCurrentStep(VerificationStep.SCAN_QR);
  };

  const handleCopyLineId = () => {
    try {
      navigator.clipboard.writeText('@601feiwz');
      toast.success('已複製 LINE ID');
    } catch (error) {
      toast.error('複製失敗，請手動複製');
    }
  };

  const onVerify = async () => {
    try {
      setIsLoading(true);
      
      if (!verificationCode || verificationCode.length !== 6) {
        toast.error('請輸入6位數驗證碼');
        return;
      }

      // 先將結果轉換為 unknown，再轉換為 VerificationResult
      const result = (await handleVerifyCode(verificationCode)) as unknown as VerificationResult;
      
      if (result.success) {
        toast.success('驗證成功');
        setVerificationStep(VerificationStep.COMPLETED);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(result.message || '驗證失敗');
      }
    } catch (error) {
      toast.error('驗證失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordAuth = async () => {
    if (hasUnsavedChanges) {
      toast.warning('請先儲存或取消目前的變更，再開始 Discord 驗證');
      return;
    }

    // 檢查是否已開啟 LINE 通知
    if (settings?.lineNotification || propSettings?.lineNotification) {
      toast.warning('您已開啟其他通知方式，請先關閉後再開啟新的通知');
      return;
    }

    // 檢查是否已開啟電子郵件通知
    if (settings?.emailNotification) {
      toast.warning('您已開啟電子郵件通知，請先關閉後再進行 Discord 驗證');
      return;
    }

    try {
      const authWindow = await startDiscordAuth(userId);
      if (!authWindow) {
        toast.error('開啟 Discord 授權視窗失敗');
        return;
      }
    } catch (error) {
      toast.error('Discord 授權失敗');
    }
  };

  // 修正取消驗證的函數名稱
  const handleCancelVerification = () => {
    setVerificationCode('');
    cancelVerification();
  };

  // 修正 Discord 取消驗證的函數名稱
  const handleCancelDiscordVerification = () => {
    setShowDiscordVerification(false);
    setIsDiscordVerifying(false);
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
                onNext={() => handleStepChange(VerificationStep.VERIFY_CODE)}
              />
            )}
            
            {currentStep === VerificationStep.VERIFY_CODE && (
              <VerifyCodeStep 
                verificationCode={verificationCode}
                setVerificationCode={setVerificationCode}
                onBack={() => handleStepChange(VerificationStep.ADD_FRIEND)}
                onVerify={onVerify}
                isLoading={isLoading}
                userId={userId}
                onCancel={handleCancelVerification}
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
                    checked={localSettings.emailNotification}
                    onChange={handleEmailToggle}
                    disabled={isLoading || !formData.email}
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
                    checked={localSettings.lineNotification}
                    onChange={handleLineToggle}
                    disabled={isLoading || !settings.lineId}
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
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
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
                          <FontAwesomeIcon 
                            icon={faInfoCircle} 
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          />
                          <div className="absolute left-1/2 bottom-full transform -translate-x-1/2 -mb-2
                            w-80 p-4 text-sm text-white 
                            bg-gray-800/95 rounded-xl opacity-0 group-hover:opacity-100 
                            transition-all duration-200 ease-in-out scale-0 group-hover:scale-100
                            shadow-xl backdrop-blur-sm pointer-events-none z-[9999]">
                            <div className="space-y-2">
                              <p className="font-semibold mb-2">Discord 綁定流程：</p>
                              <ol className="list-decimal list-inside space-y-1.5">
                                <li>在 Discord 應用程式的「+」號按鈕建立一個伺服器</li>
                                <li>選擇「建立自己的」來創建全新伺服器</li>
                                <li>點擊「使用 Discord 登入」按鈕</li>
                                <li>在彈出視窗中登入您的 Discord 帳號</li>
                                <li>在您的 Discord 帳號中加入此伺服器</li>
                                <li>允許 AWS Blog 365 Bot 向您發送訊息</li>
                                <li>完成後將會收到一則測試訊息！</li>
                              </ol>
                              <div className="mt-3 pt-2 border-t border-gray-700">
                                <p className="text-gray-300 text-xs">
                                  注意：
                                  <br/>1. 請確保您的 Discord 隱私設定允許接收來自伺服器成員的私人訊息。
                                  <br/>2. 因 Discord 的安全機制，機器人和使用者必須共同存在於至少一個伺服器中，否則無法收到訊息。
                                </p>
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1
                              w-2 h-2 bg-gray-800/95 rotate-45">
                            </div>
                          </div>
                        </span>
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
                            shadow-xl backdrop-blur-sm pointer-events-none z-[9999]">
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
                    checked={localSettings.discordNotification}
                    onChange={handleDiscordToggle}
                    disabled={isLoading || !settings.discordId}
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
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
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
            {hasUnsavedChanges && (
              <button
                onClick={handleReset}
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
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className={`
                px-6 py-2.5 rounded-lg flex items-center gap-2
                ${isSaving || !hasUnsavedChanges 
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
          onCancel={handleCancelDiscordVerification}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default NotificationSectionUI;