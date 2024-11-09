import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faInfoCircle,
  faCopy,
  faEnvelope,
  faExclamationCircle,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { faLine } from '@fortawesome/free-brands-svg-icons';
import { Switch } from '@mui/material';
import { toast } from 'react-toastify';
import { NotificationSectionProps } from '@/types/profileTypes';
import { VerificationStep, VerificationStatus } from '@/types/lineTypes';
import QRCodeImage from '@/assets/images/line-qrcode.png'; // 請確保添加實際的 QR Code 圖片

// 純 UI 組件
const NotificationSectionUI: React.FC<NotificationSectionProps> = ({
  verificationState,
  lineId,
  setLineId,
  verificationCode,
  setVerificationCode,
  handleVerification,
  onCopyUserId,
  userId,
  notificationSettings,
  handleNotificationChange,
  isLoading
}) => {
  const renderVerificationStatus = () => {
    if (verificationState.status === 'error') {
      return (
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-red-600">
            <FontAwesomeIcon icon={faExclamationCircle} />
            <span>{verificationState.message || '驗證失敗'}</span>
          </div>
        </div>
      );
    }

    if (verificationState.isVerified) {
      return (
        <div className="bg-green-50 p-6 rounded-lg text-center">
          <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-500 mb-3" />
          <h3 className="text-xl font-semibold text-green-600">驗證成功！</h3>
          <p className="text-green-600">您已成功開啟 LINE 通知功能</p>
        </div>
      );
    }

    return null;
  };

  const renderProgressStatus = () => {
    const steps = [
      { label: '加入好友', completed: verificationState.step !== VerificationStep.IDLE },
      { label: '取得驗證碼', completed: verificationState.step >= VerificationStep.VERIFYING },
      { label: '完成驗證', completed: verificationState.step === VerificationStep.COMPLETE }
    ];

    return (
      <div className="relative mb-8">
        {/* 進度條背景 */}
        <div className="absolute top-4 left-0 w-full h-1 bg-gray-200"></div>
        {/* 完成的進度 */}
        <div 
          className="absolute top-4 left-0 h-1 bg-green-500 transition-all duration-500"
          style={{ width: `${(Number(verificationState.step) / (Object.keys(VerificationStep).length - 1)) * 100}%` }}
        ></div>
        
        <div className="flex justify-between relative">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                transition-all duration-300 mb-2
                ${step.completed 
                  ? 'bg-green-500 text-white shadow-lg scale-110' 
                  : 'bg-white border-2 border-gray-300 text-gray-500'
                }
              `}>
                {step.completed ? '✓' : index + 1}
              </div>
              <span className={`
                text-sm font-medium transition-colors duration-300
                ${step.completed ? 'text-green-600' : 'text-gray-500'}
              `}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-800 border-b pb-4 mb-6">訂閱通知設定</h1>

      <div className="space-y-6">
        {/* 電子郵件通知設定 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">電子郵件通知</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faEnvelope} className="text-gray-600" />
                <div>
                  <p className="font-medium">電子郵件通知</p>
                  <p className="text-sm text-gray-500">接收重要更新和活動提醒</p>
                </div>
              </div>
              <Switch
                checked={notificationSettings.email}
                onChange={() => handleNotificationChange('email')}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* LINE 通知設定卡片 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <FontAwesomeIcon icon={faLine} className="text-[#00B900] text-3xl" />
              LINE 通知設定
            </h2>

            {!verificationState.isVerified && renderProgressStatus()}

            {!verificationState.isVerified ? (
              <div className="space-y-8">
                {/* 步驟 1: 加入好友 */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">1</span>
                    加入官方帳號好友
                  </h3>
                  <div className="flex justify-center items-center gap-12">
                    <div className="flex flex-col items-center bg-white rounded-lg border border-gray-200 p-6">
                      <img 
                        src="/Line-QR-Code.png" 
                        alt="LINE QR Code" 
                        className="w-48 h-48 object-contain mb-3"
                      />
                      <p className="text-sm text-gray-500">使用 LINE 掃描 QR Code</p>
                    </div>
                    <div className="flex items-center">
                      <a
                        href="https://line.me/R/ti/p/@601feiwz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-3 bg-[#00B900] text-white px-8 py-4 rounded-lg hover:bg-[#009900] transition-all hover:scale-105 text-lg font-medium whitespace-nowrap"
                      >
                        <FontAwesomeIcon icon={faLine} className="text-xl" />
                        加入 LINE 好友
                      </a>
                    </div>
                  </div>
                </div>

                {/* 步驟 2: 輸入 LINE ID */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">2</span>
                    輸入您的 LINE ID
                  </h3>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <input
                      type="text"
                      value={lineId}
                      onChange={(e) => setLineId(e.target.value)}
                      placeholder="請輸入您的 LINE ID"
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* 步驟 3: 輸入驗證碼 */}
                {verificationState.step >= VerificationStep.VERIFYING && (
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">3</span>
                      輸入驗證碼
                    </h3>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex gap-4">
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="請輸入驗證碼"
                          className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                        <button
                          onClick={handleVerification}
                          disabled={isLoading}
                          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-all hover:scale-105 disabled:bg-gray-400 disabled:hover:scale-100 whitespace-nowrap"
                        >
                          {isLoading ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              驗證中
                            </span>
                          ) : '驗證'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-green-50 p-6 rounded-xl text-center">
                <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-500 mb-3" />
                <h3 className="text-xl font-semibold text-green-600">驗證成功！</h3>
                <p className="text-green-600">您已成功開啟 LINE 通知功能</p>
              </div>
            )}
          </div>
        </div>

        {/* 通知說明卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500" />
            通知說明
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-600">
              <FontAwesomeIcon icon={faLine} className="text-[#00B900]" />
              <p>即時接收最新文章和重要更新</p>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <FontAwesomeIcon icon={faEnvelope} />
              <p>系統將發送重要更新和活動提醒</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationSectionUI; 