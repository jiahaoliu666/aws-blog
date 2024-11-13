import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faGlobe,
  faSave,
  faCheckCircle,
  faQrcode,
  faArrowRight,
  faShield,
  faInfoCircle
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

      {/* LINE 通知卡片 - 優化版本 */}
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
              disabled={loading || (!isVerified && settings.line)}
              className="scale-110"
            />
          </div>
        </div>

        {/* 驗證流程區域 */}
        {settings.line && !isVerified && (
          <div className="p-6 bg-gray-50">
            {/* 驗證步驟指示器 */}
            <div className="mb-8">
              <div className="flex justify-between items-center relative">
                {/* 連接線 */}
                <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200">
                  <div 
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${verificationProgress}%` }}
                  />
                </div>
                
                {/* 步驟 1: 加入好友 */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${verificationStep === VerificationStep.ADD_FRIEND ? 'bg-green-500 text-white' : 
                      verificationStep > VerificationStep.ADD_FRIEND ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                  `}>
                    <FontAwesomeIcon icon={faQrcode} />
                  </div>
                  <span className="text-xs text-gray-600">加入好友</span>
                </div>

                {/* 步驟 2: 取得驗證碼 */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${verificationStep === VerificationStep.INPUT_LINE_ID ? 'bg-green-500 text-white' :
                      verificationStep > VerificationStep.INPUT_LINE_ID ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                  `}>
                    <FontAwesomeIcon icon={faLine} />
                  </div>
                  <span className="text-xs text-gray-600">取得驗證碼</span>
                </div>

                {/* 步驟 3: 完成驗證 */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${verificationStep === VerificationStep.VERIFY_CODE ? 'bg-green-500 text-white' :
                      verificationStep > VerificationStep.VERIFY_CODE ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                  `}>
                    <FontAwesomeIcon icon={faShield} />
                  </div>
                  <span className="text-xs text-gray-600">完成驗證</span>
                </div>
              </div>
            </div>

            {/* 當前步驟內容 */}
            <div className="max-w-2xl mx-auto">
              {/* 步驟 1: 加入好友內容 */}
              {verificationStep === VerificationStep.ADD_FRIEND && (
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-800 mb-4">加入 LINE 官方帳號</h4>
                  <div className="flex gap-6 items-center">
                    <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                      {/* QR Code 圖片 */}
                      <img 
                        src="/path-to-qr-code.png" 
                        alt="LINE QR Code"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <p className="text-gray-600 mb-4">
                        請使用以下任一方式加入我們的 LINE 官方帳號：
                      </p>
                      <div className="space-y-3">
                        <button
                          onClick={() => window.open('line://ti/p/@your-line-id')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        >
                          <FontAwesomeIcon icon={faLine} />
                          <span>點擊加入好友</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">LINE ID：</span>
                          <code className="px-2 py-1 bg-gray-100 rounded text-sm">@your-line-id</code>
                          <button
                            onClick={props.onCopyUserId}
                            className="text-blue-500 hover:text-blue-600 text-sm"
                          >
                            複製
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={props.handleStartVerification}
                      className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors"
                    >
                      已加入好友，下一步
                    </button>
                  </div>
                </div>
              )}

              {/* 步驟 2: 取得驗證碼內容 */}
              {verificationStep === VerificationStep.INPUT_LINE_ID && (
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-800 mb-4">取得驗證碼</h4>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      請在 LINE 官方帳號中傳送以下 ID，我們將立即發送驗證碼給您：
                    </p>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <code className="text-lg font-mono">{props.userId}</code>
                      <button
                        onClick={() => navigator.clipboard.writeText(props.userId)}
                        className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                      >
                        複製
                      </button>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 text-blue-500">
                          <FontAwesomeIcon icon={faInfoCircle} />
                        </div>
                        <p className="text-sm text-blue-700">
                          將此 ID 傳送給官方帳號後，您將收到一組 6 位數的驗證碼
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => setVerificationStep(VerificationStep.ADD_FRIEND)}
                      className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      返回上一步
                    </button>
                    <button
                      onClick={props.handleVerification}
                      className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors"
                    >
                      已收到驗證碼，下一步
                    </button>
                  </div>
                </div>
              )}

              {/* 步驟 3: 輸入驗證碼內容 */}
              {verificationStep === VerificationStep.VERIFY_CODE && (
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-800 mb-4">輸入驗證碼</h4>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      請輸入我們透過 LINE 發送給您的 6 位數驗證碼：
                    </p>
                    <div className="flex gap-2 justify-center">
                      {[...Array(6)].map((_, index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength={1}
                          className="w-12 h-12 text-center text-xl font-mono border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                          value={props.verificationCode[index] || ''}
                          onChange={(e) => {
                            const newCode = props.verificationCode.split('');
                            newCode[index] = e.target.value;
                            props.setVerificationCode(newCode.join(''));
                            // 自動跳到下一個輸入框
                            if (e.target.value && index < 5) {
                              const nextInput = e.target.parentElement?.nextElementSibling?.querySelector('input');
                              nextInput?.focus();
                            }
                          }}
                        />
                      ))}
                    </div>
                    <div className="text-center">
                      <button
                        onClick={() => {/* 重新發送驗證碼邏輯 */}}
                        className="text-sm text-blue-500 hover:text-blue-600"
                      >
                        沒收到驗證碼？重新發送
                      </button>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={() => setVerificationStep(VerificationStep.INPUT_LINE_ID)}
                      className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      返回上一步
                    </button>
                    <button
                      onClick={props.verifyLineIdAndCode}
                      disabled={props.verificationCode.length !== 6}
                      className={`
                        px-6 py-2 rounded-lg transition-colors
                        ${props.verificationCode.length === 6
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                      `}
                    >
                      完成驗證
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 驗證完成狀態 */}
        {settings.line && isVerified && (
          <div className="p-6 bg-green-50">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-green-500 text-white flex items-center justify-center">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-2xl" />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-800">LINE 通知已啟用</h4>
                <p className="text-gray-600">
                  您已成功綁定 LINE 帳號，將可以即時收到重要通知
                </p>
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