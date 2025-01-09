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
  faThumbsUp,
  faClock,
  faLink,
  faHandshake
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
    <div className="flex justify-between relative mt-4 lg:mt-0">
      {/* 背景進度條 */}
      <div className="absolute top-5 lg:top-6 left-0 w-full h-0.5 bg-gray-200" />
      
      {/* 活動進度條 */}
      <div 
        className="absolute top-5 lg:top-6 left-0 h-0.5 bg-green-500 transition-all duration-300"
        style={{ 
          width: `${(currentStepIndex / (steps.length - 1)) * 100}%`
        }} 
      />

      {steps.map(({ step, label, icon }, index) => (
        <div 
          key={step}
          className="relative flex flex-col items-center lg:w-1/3 w-full px-2 lg:px-0"
        >
          {/* 圓形指示器 */}
          <div className={`
            w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center z-10
            transition-all duration-300 ease-in-out
            ${currentStep === step 
              ? 'bg-green-500 text-white shadow-lg scale-110' 
              : index <= currentStepIndex
                ? 'bg-green-200 text-green-700'
                : 'bg-gray-100 text-gray-400'
            }
          `}>
            <FontAwesomeIcon icon={icon} className="text-base lg:text-lg" />
          </div>
          
          {/* 標籤文字 */}
          <span className={`
            text-xs lg:text-sm mt-2 lg:mt-3 font-medium transition-colors duration-300 text-center
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
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg mb-4 sm:mb-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
        {/* QR Code 區塊 */}
        <div className="text-center w-full sm:w-auto">
          <div className="mb-4">
            <img 
              src="/Line-QR-Code.png" 
              alt="LINE QR Code" 
              className="w-36 h-36 sm:w-48 sm:h-48 mx-auto"
            />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">掃描 QR Code</h3>
          <p className="text-sm text-gray-600">
            開啟 LINE 應用程式
            <br />點擊「加入好友」後掃描
          </p>
        </div>

        {/* 分隔線 - 在手機版隱藏，平板以上顯示 */}
        <div className="hidden sm:block h-64 w-px bg-gray-200 relative">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                        bg-white text-gray-400 px-2 text-sm">
            或
          </div>
        </div>

        {/* 手機版的分隔線 */}
        <div className="sm:hidden w-full py-4 relative">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                        bg-white text-gray-400 px-4 text-sm z-10">
            或
          </div>
          <div className="w-full h-px bg-gray-200"></div>
        </div>

        {/* LINE ID 搜尋區塊 */}
        <div className="text-center w-full sm:w-auto">
          <div className="mb-4">
            <div className="w-full sm:w-48 h-36 sm:h-48 flex items-center justify-center">
              <div className="text-center w-full px-4 sm:px-0">
                <FontAwesomeIcon icon={faLine} className="text-4xl sm:text-5xl text-green-500 mb-4" />
                <div className="relative group">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 sm:px-6 py-3 pr-12
                                font-mono text-base sm:text-lg text-gray-700 select-all break-all">
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
                  </button>
                </div>
              </div>
            </div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">搜尋 LINE ID</h3>
          <p className="text-sm text-gray-600">
            開啟 LINE 應用程式
            <br />搜尋 ID 加好友
          </p>
        </div>
      </div>
    </div>

    <button
      onClick={onNext}
      className="bg-green-500 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl hover:bg-green-600 
                 transition-all duration-300 shadow-md hover:shadow-lg transform 
                 hover:-translate-y-0.5 flex items-center gap-2 mx-auto text-sm sm:text-base"
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
      <div className="bg-white p-8 rounded-xl mb-6 relative">
        <FontAwesomeIcon icon={faPaperPlane} className="text-5xl text-green-500 mb-4" />
        <h3 className="text-xl font-semibold mb-3">驗證碼</h3>
        
        {!verificationCode ? (
          <div className="flex flex-col items-center">
            <p className="text-gray-600 mb-6">請點擊下方按鈕生成驗證碼</p>
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={onBack}
                disabled={isGenerating}
                className="px-6 py-3 rounded-lg text-gray-700 bg-gray-100
                         hover:bg-gray-200 active:bg-gray-300
                         transition-all duration-200
                         flex items-center gap-2
                         focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                返回上一步
              </button>
              <button
                onClick={generateVerificationCode}
                disabled={isGenerating}
                className={`
                  px-6 py-3 rounded-lg text-white
                  ${isGenerating ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}
                  transition-colors duration-200
                  flex items-center justify-center gap-2
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
            </div>
            
            <button
              onClick={onBack}
              disabled={isGenerating}
              className="w-full max-w-[280px] px-6 py-2.5 rounded-lg text-gray-700 bg-gray-100
                       hover:bg-gray-200 active:bg-gray-300
                       transition-all duration-200
                       flex items-center justify-center gap-2
                       focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              返回上一步
            </button>
          </div>
        ) : (
          <div className="w-full max-w-md mx-auto">
            <div className="relative mb-8">
              <div className="text-center">
                <div className="inline-block bg-green-500 text-white px-4 py-1 rounded-full text-sm mb-4">
                  驗證碼
                </div>
              </div>
              
              <div className="relative">
                <div className="flex items-center justify-center">
                  <div className="relative group w-full">
                    <div className="bg-white px-4 py-3 rounded-lg border border-gray-200
                                  font-mono text-2xl sm:text-3xl tracking-[0.5em]
                                  text-gray-800 select-all max-w-full overflow-x-auto text-center">
                      {verificationCode}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(verificationCode);
                        toast.success('已複製驗證碼');
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2
                               p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg
                               hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      title="複製驗證碼"
                    >
                      <FontAwesomeIcon icon={faCopy} className="text-lg" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={onBack}
          disabled={isGenerating}
          className="px-6 py-2.5 rounded-lg text-gray-700 bg-gray-100
                   hover:bg-gray-200 active:bg-gray-300
                   transition-all duration-200
                   flex items-center gap-2
                   focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          返回上一步
        </button>
        {verificationCode && (
          <button
            onClick={onNext}
            disabled={isGenerating}
            className={`
              bg-green-500 text-white px-6 py-2.5 rounded-lg 
              hover:bg-green-600 transition-colors 
              flex items-center gap-2
              ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span>下一步</span>
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        )}
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
  setVerificationStep: (step: VerificationStep) => void;
  handleResetVerification: () => Promise<void>;
}> = ({ 
  verificationCode, 
  setVerificationCode, 
  onBack, 
  onVerify, 
  isLoading, 
  userId,
  onCancel,
  setVerificationStep,
  handleResetVerification 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'back' | 'cancel'>('back');

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 倒數計時器
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft]);

  // 驗證狀態輪詢
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (generatedCode) {
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/line/verification-status?userId=${userId}`);
          const data = await response.json();
          
          if (data.success && data.isVerified) {
            clearInterval(pollInterval);
            toast.success('LINE 驗證成功！');
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }
        } catch (error) {
          logger.error('檢查驗證狀態失敗:', error);
        }
      }, 3000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [generatedCode, userId]);

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

  const handleBack = () => {
    if (generatedCode) {
      setDialogType('back');
      setShowConfirmDialog(true);
    } else {
      onBack();
    }
  };

  const handleCancelVerification = () => {
    setVerificationCode('');
    handleResetVerification();
    setVerificationStep(VerificationStep.INITIAL);
    toast.warning('LINE 驗證已取消');
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
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg mb-6 border border-gray-100">
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
              <div className="w-full max-w-md mx-auto">
                <div className="relative mb-8">
                  <div className="text-center">
                    <div className="inline-block bg-green-500 text-white px-4 py-1 rounded-full text-sm mb-4">
                      驗證碼
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="flex items-center justify-center">
                      <div className="relative group w-full">
                        <div className="bg-white px-4 py-3 rounded-lg border border-gray-200
                                    font-mono text-2xl sm:text-3xl tracking-[0.5em]
                                    text-gray-800 select-all max-w-full overflow-x-auto text-center">
                          {generatedCode}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedCode);
                            toast.success('已複製驗證碼');
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2
                                   p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg
                                   hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                          title="複製驗證碼"
                        >
                          <FontAwesomeIcon icon={faCopy} className="text-lg" />
                        </button>
                      </div>
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
              </div>
            )}
          </div>
        </div>
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
      
      // 檢查是否有未儲存的 Discord 設定變更，且當前操作涉及驗證流程
      if (type === 'email' && 
          prev.discordNotification !== settings.discordNotification &&
          !prev.emailNotification) { // 只在要開啟電子郵件通知時檢查
        toast.warning('請先儲存或取消目前的變更，再開始電子郵件驗證');
        return prev;
      }

      // 檢查是否有未儲存的 LINE 設定變更，且當前操作涉及驗證流程
      if (type !== 'line' && 
          prev.lineNotification !== settings.lineNotification &&
          !prev[`${type}Notification`]) { // 只在要開啟新通知時檢查
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

      // 允許切換開關狀態
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

  // 在 NotificationSectionUI 組件內部新增狀態追蹤
  const [discordAuthWindow, setDiscordAuthWindow] = useState<Window | null>(null);
  const [discordAuthStatus, setDiscordAuthStatus] = useState<'initial' | 'authorizing' | 'completed' | 'cancelled'>('initial');

  // 監聽 Discord 授權視窗狀態
  useEffect(() => {
    if (discordAuthWindow) {
      const checkWindow = setInterval(() => {
        if (discordAuthWindow.closed) {
          clearInterval(checkWindow);
          // 如果視窗被關閉且狀態仍在授權中，表示用戶取消操作
          if (discordAuthStatus === 'authorizing') {
            setDiscordAuthStatus('cancelled');
            setIsDiscordVerifying(false);
            toast.warning('Discord 授權已取消');
          }
        }
      }, 500);

      return () => clearInterval(checkWindow);
    }
  }, [discordAuthWindow, discordAuthStatus]);

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
      setDiscordAuthStatus('authorizing');
      const authWindow = await startDiscordAuth(userId);
      
      if (!authWindow) {
        setDiscordAuthStatus('cancelled');
        toast.error('開啟 Discord 授權視窗失敗');
        return;
      }
      
      setDiscordAuthWindow(authWindow);
    } catch (error) {
      setDiscordAuthStatus('cancelled');
      toast.error('Discord 授權失敗');
    }
  };

  // 修改 useEffect 中的 Discord 授權訊息處理
  useEffect(() => {
    const handleDiscordAuthMessage = (event: MessageEvent) => {
      if (event.data.type === 'DISCORD_AUTH_SUCCESS') {
        if (discordAuthStatus === 'authorizing') {
          setSettings(prev => ({
            ...prev,
            discordId: event.data.discord_id,
            discordNotification: true
          }));
          setDiscordAuthStatus('completed');
          setShowDiscordVerification(false);
          setIsDiscordVerifying(false);
          
          toast.success('Discord 綁定成功');
          
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else if (event.data.type === 'DISCORD_AUTH_ERROR') {
        if (discordAuthStatus === 'authorizing') {
          setDiscordAuthStatus('cancelled');
          setIsDiscordVerifying(false);
          toast.error(event.data.error || 'Discord 綁定失敗');
          logger.error('Discord 授權失敗:', event.data.error);
        }
      }
    };

    window.addEventListener('message', handleDiscordAuthMessage);
    return () => window.removeEventListener('message', handleDiscordAuthMessage);
  }, [discordAuthStatus]);

  // 修正取消驗證的函數名稱
  const handleCancelVerification = () => {
    setVerificationCode('');
    handleResetVerification();
    setVerificationStep(VerificationStep.INITIAL);
    toast.warning('LINE 驗證已取消');
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
        <div className="mb-6 sm:mb-8 relative">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">LINE 驗證</h2>
            <p className="text-sm sm:text-base text-gray-600">請依照以下步驟完成 LINE 驗證</p>
          </div>

          {/* 步驟指示器 */}
          <div className="w-full overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
            <div className="min-w-[320px] lg:min-w-0 px-4 lg:px-0">
              <StepIndicators 
                currentStep={currentStep} 
                onStepClick={handleStepChange} 
              />
            </div>
          </div>

          {/* 驗證步驟內容 */}
          <div className="mt-6 lg:mt-8">
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
                setVerificationStep={setVerificationStep}
                handleResetVerification={handleResetVerification}
              />
            )}
          </div>

          {/* 取消按鈕 */}
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
        <>
          <div className="mb-6 sm:mb-8">
            <SectionTitle 
              title="通知設定"
              description="選擇您習慣的接收方式 (僅限一種)"
            />
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* 電子郵件通知卡片 */}
            <Card>
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-4 sm:gap-6">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon 
                        icon={faEnvelope} 
                        className="text-lg sm:text-xl text-blue-500"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800">電子郵件通知</h3>
                      <p className="text-xs sm:text-sm text-gray-600">透過 Mail 接收即時通知</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 
                          text-blue-700 text-xs font-medium rounded-full border border-blue-200
                          shadow-sm shadow-blue-100/50">
                          <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                          已綁定
                        </span>
                        <span className="text-xs text-gray-500 break-all truncate">{formData.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
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
              </div>
            </Card>

            {/* LINE 通知卡片 */}
            <Card>
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-4 sm:gap-6">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon 
                        icon={faLine} 
                        className="text-lg sm:text-xl text-green-500"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800">LINE 通知</h3>
                      <p className="text-xs sm:text-sm text-gray-600">透過 LINE 接收即時通知</p>
                      {settings.lineId ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 
                            text-green-700 text-xs font-medium rounded-full border border-green-200
                            shadow-sm shadow-green-100/50">
                            <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                            已綁定
                          </span>
                          <span className="text-xs text-gray-500 break-all truncate">
                            LINE ID: {settings.lineId}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 
                            text-gray-500 text-xs font-medium rounded-full border border-gray-200">
                            未綁定
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
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
              </div>

              {/* LINE 驗證流程區域 */}
              {!settings.lineId && !settings.lineNotification && (
                <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">需要先完成 LINE 驗證才能啟用通知功能</p>
                    <button
                      onClick={handleStartLineVerification}
                      className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg 
                        hover:bg-blue-700 active:bg-blue-800
                        transition-all duration-200 ease-in-out
                        flex items-center gap-2 mx-auto text-sm sm:text-base
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
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-4 sm:gap-6">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon 
                        icon={faDiscord} 
                        className="text-lg sm:text-xl text-indigo-500"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 flex flex-col gap-2 relative">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-2">
                            Discord 通知
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="relative group cursor-help">
                              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 border border-indigo-200
                                hover:bg-indigo-100 transition-colors">
                                <FontAwesomeIcon 
                                  icon={faDiscord}
                                  className="text-indigo-500 text-sm"
                                />
                                <span className="text-xs text-indigo-700 font-medium">綁定教學</span>
                              </div>
                              <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2
                                w-[calc(100vw-2rem)] sm:w-[320px] max-h-[80vh] overflow-y-auto
                                p-4 text-sm text-white bg-gray-800/95 rounded-xl opacity-0 group-hover:opacity-100 
                                transition-all duration-200 ease-in-out scale-0 group-hover:scale-100
                                shadow-xl backdrop-blur-sm z-[9999]">
                                <div className="relative">
                                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
                                    <p className="font-semibold flex items-center gap-2">
                                      <FontAwesomeIcon icon={faDiscord} className="text-indigo-400" />
                                      Discord 綁定流程
                                    </p>
                                    <span className="text-xs text-indigo-400">請選擇以下其中一種方式</span>
                                  </div>
                                  <div className="space-y-4">
                                    {/* 已有伺服器的流程 */}
                                    <div className="p-3 bg-gray-700/50 rounded-lg">
                                      <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                        一、已有 Discord 伺服器用戶
                                      </h4>
                                      <ol className="list-decimal list-inside space-y-1.5 text-sm">
                                        <li>點擊「使用 Discord 登入」</li>
                                        <li>在彈出視窗中，登入您的 Discord 帳號</li>
                                        <li>選擇您擁有管理員權限的伺服器</li>
                                        <li>授權 AWS Blog 365 Bot 加入伺服器</li>
                                        <li>設定完成後，即可收到測試通知！</li>
                                      </ol>
                                    </div>

                                    {/* 分隔線 */}
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-px bg-gray-700"></div>
                                      <span className="text-gray-500 text-sm">或是</span>
                                      <div className="flex-1 h-px bg-gray-700"></div>
                                    </div>

                                    {/* 新建伺服器的流程 */}
                                    <div className="p-3 bg-gray-700/50 rounded-lg">
                                      <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                        二、建立新 Discord 伺服器用戶
                                      </h4>
                                      <ol className="list-decimal list-inside space-y-1.5 text-sm">
                                        <li>點擊 Discord 應用程式的「+」號來建立伺服器</li>
                                        <li>選擇「建立自己的」來創建新伺服器</li>
                                        <li>接著按照上述「已有伺服器用戶」的步驟，完成登入與授權流程</li>
                                      </ol>
                                    </div>
                                  </div>
                                  <div className="mt-3 pt-2 border-t border-gray-700">
                                    <p className="text-gray-300 text-xs">
                                      注意：
                                      <br/>1. 請確保您的 Discord 隱私設定允許接收來自伺服器成員的私人訊息。
                                      <br/>2. 因 Discord 的安全機制，機器人和使用者必須共同存在於至少一個伺服器中，否則無法收到訊息。
                                      <br/>3. 如果選擇使用現有伺服器，您必須具有該伺服器的管理員權限。
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </span>
                            <span className="relative group cursor-help">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5
                                bg-gradient-to-r from-blue-500 to-indigo-600
                                text-white text-xs font-bold rounded-full
                                shadow-sm hover:shadow-md hover:scale-105
                                transition-all duration-200 transform">
                                <FontAwesomeIcon 
                                  icon={faThumbsUp} 
                                  className="text-white text-[11px] animate-pulse"
                                />
                                推薦
                              </span>
                              <div className="absolute left-1/2 bottom-full transform -translate-x-1/2 -mb-2
                                w-[280px] xs:w-80 p-4 text-sm text-white 
                                bg-gray-800/95 rounded-xl opacity-0 group-hover:opacity-100 
                                transition-all duration-200 ease-in-out scale-0 group-hover:scale-100
                                shadow-xl backdrop-blur-sm pointer-events-none z-[9999]">
                                <div className="flex items-center gap-2">
                                  <FontAwesomeIcon icon={faThumbsUp} className="text-blue-400 flex-shrink-0" />
                                  <span className="break-words">此功能完全免費！推薦使用 Discord 接收通知</span>
                                </div>
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1
                                  w-2 h-2 bg-gray-800/95 rotate-45 hidden sm:block">
                                </div>
                              </div>
                            </span>
                          </div>
                        </div>
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">透過 Discord 接收即時通知</p>
                      {settings.discordId ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 
                            text-indigo-700 text-xs font-medium rounded-full border border-indigo-200">
                            <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                            已綁定
                          </span>
                          <span className="text-xs text-gray-500 break-all truncate">
                            Discord ID: {settings.discordId}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 
                            text-gray-500 text-xs font-medium rounded-full border border-gray-200">
                            未綁定
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
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
              </div>

              {/* Discord 驗證流程區域 */}
              {!settings.discordId && !settings.discordNotification && (
                <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">需要先完成 Discord 驗證才能啟用通知功能</p>
                    <button
                      onClick={handleDiscordAuth}
                      className={`
                        bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg 
                        hover:bg-indigo-700 active:bg-indigo-800
                        transition-all duration-200 ease-in-out
                        flex items-center gap-2 mx-auto text-sm sm:text-base
                        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${discordAuthStatus === 'authorizing' ? 'animate-pulse' : ''}
                      `}
                      disabled={discordAuthStatus === 'authorizing'}
                    >
                      <FontAwesomeIcon icon={faDiscord} />
                      {discordAuthStatus === 'authorizing' ? (
                        <>
                          <span className="animate-spin mr-2">⌛</span>
                          授權中...
                        </>
                      ) : discordAuthStatus === 'completed' ? (
                        '驗證完成'
                      ) : discordAuthStatus === 'cancelled' ? (
                        '使用 Discord 登入'
                      ) : (
                        '使用 Discord 登入'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* 儲存按鈕區域 */}
          <div className="flex justify-end mt-4 sm:mt-6 gap-3">
            {hasUnsavedChanges && (
              <button
                onClick={handleReset}
                className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-gray-700 border border-gray-200
                  hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300
                  transition-all duration-200 text-sm sm:text-base
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
                px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg flex items-center gap-2 text-sm sm:text-base
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