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
      { label: '進行驗證', completed: verificationState.step >= VerificationStep.VERIFYING },
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

            {/* 進度指示器 */}
            {!verificationState.isVerified && renderProgressStatus()}

            {!verificationState.isVerified ? (
              <div className="space-y-8">
                {/* 步驟 1: 加入好友說明 */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4">
                    <span className="w-8 h-8 rounded-full bg-blue-500 text-white inline-flex items-center justify-center mr-2">1</span>
                    加入官方帳號
                  </h3>
                  <p className="text-sm text-gray-500">在LINE中輸入「驗證」取得驗證資訊</p>
                  <div className="flex justify-center items-center gap-8">
                    <div className="text-center space-y-4">
                      <div className="bg-white p-4 rounded-lg border">
                        <img src="/Line-QR-Code.png" alt="LINE QR Code" className="w-40 h-40 mx-auto" />
                      </div>
                      <p className="text-sm text-gray-600">掃描 QR Code </p>
                    </div>
                    <div className="text-center space-y-4">
                      <a href="https://line.me/R/ti/p/@YOUR_LINE_ID" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="inline-block bg-[#00B900] text-white px-6 py-3 rounded-lg hover:bg-[#009900]">
                        <FontAwesomeIcon icon={faLine} className="mr-2" />
                        加入好友
                      </a>
                      <p className="text-sm text-gray-600">或點擊按鈕加入好友</p>
                    </div>
                  </div>
                </div>

                {/* 步驟 2: 驗證資訊輸入 */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold mb-4">
                    <span className="w-8 h-8 rounded-full bg-blue-500 text-white inline-flex items-center justify-center mr-2">2</span>
                    輸入驗證資訊
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">LINE ID</label>
                      <input
                        type="text"
                        value={lineId}
                        onChange={(e) => setLineId(e.target.value)}
                        placeholder="請輸入LINE回傳的ID"
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">驗證碼</label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="請輸入LINE回傳的驗證碼"
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                    <button
                      onClick={handleVerification}
                      disabled={isLoading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {isLoading ? '驗證中...' : '驗證'}
                    </button>
                  </div>
                </div>
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