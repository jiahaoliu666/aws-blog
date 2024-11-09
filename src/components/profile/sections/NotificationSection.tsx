import React, { useState } from 'react';
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
  isLoading,
  formData = { email: '', username: '' },
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
      { label: '加入官方帳號', completed: verificationState.step !== VerificationStep.IDLE },
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

      <div className="space-y-8">
        {/* 電子郵件通知設定 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <FontAwesomeIcon icon={faEnvelope} className="text-gray-600 text-xl" />
                <div>
                  <p className="font-medium text-gray-800">電子郵件通知</p>
                  <p className="text-sm text-gray-500 mt-1">使用電子郵件接收最新發布的文章</p>
                </div>
              </div>
              <Switch
                checked={notificationSettings.email}
                onChange={() => handleNotificationChange('email')}
                disabled={isLoading}
              />
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                電子郵件地址
              </label>
              <input
                type="email"
                value={formData?.email || ''}
                disabled
                className="w-full px-4 py-2 bg-gray-100 border rounded-lg text-gray-600"
              />
            </div>
          </div>
        </div>

        {/* LINE 通知設定卡片 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold flex items-center gap-4">
                <FontAwesomeIcon icon={faLine} className="text-[#00B900] text-3xl" />
                LINE 通知設定
              </h2>
              {verificationState.isVerified && (
                <Switch
                  checked={notificationSettings.line}
                  onChange={() => handleNotificationChange('line')}
                  disabled={isLoading}
                />
              )}
            </div>

            {/* 進度指示器 */}
            {!verificationState.isVerified && renderProgressStatus()}

            {!verificationState.isVerified ? (
              <div className="space-y-10">
                {/* 步驟 1: 加入官方帳號說明 */}
                <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-full bg-blue-500 text-white inline-flex items-center justify-center text-lg font-medium">1</span>
                    <h3 className="text-xl font-semibold text-gray-800">加入官方帳號</h3>
                  </div>
                  
                  <div className="bg-white rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 text-xl" />
                      <p className="text-gray-700 font-medium">請完成以下步驟：</p>
                    </div>
                    <ol className="list-decimal list-inside space-y-3 text-gray-600 ml-4">
                      <li>掃描下方 QR Code 或點擊「加入官方帳號」按鈕</li>
                      <li>加入官方帳號後，在聊天室中輸入「<span className="font-medium text-blue-600">驗證</span>」</li>
                      <li>系統將回傳您的 LINE ID 和驗證碼</li>
                    </ol>
                  </div>

                  <div className="flex justify-center items-center gap-12">
                    <div className="text-center">
                      <div className="rounded-lg mb-3">
                        <img 
                          src="/Line-QR-Code.png" 
                          alt="LINE QR Code" 
                          className="w-44 h-44 mx-auto"
                        />
                      </div>
                      <p className="text-sm text-gray-500">掃描 QR Code</p>
                    </div>

                    <div className="flex items-center text-gray-500 text-lg font-medium">
                      或
                    </div>

                    <div className="text-center flex flex-col items-center">
                      <div className="mb-3">
                        <a 
                          href="https://line.me/R/ti/p/@601feiwz" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-[#00B900] text-white px-8 py-4 rounded-lg hover:bg-[#009900] transition-colors shadow-md hover:shadow-lg"
                        >
                          <FontAwesomeIcon icon={faLine} className="text-xl" />
                          <span className="font-medium">加入官方帳號</span>
                        </a>
                      </div>
                      <p className="text-sm text-gray-500">點擊按鈕加入官方帳號</p>
                    </div>
                  </div>
                </div>

                {/* 步驟 2: 驗證資訊輸入 */}
                <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 hover:border-gray-300 transition-colors">
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
              <div className="bg-green-50 p-8 rounded-xl text-center">
                <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-500 mb-3" />
                <h3 className="text-xl font-semibold text-green-600">驗證成功！</h3>
                <p className="text-green-600">您已成功開啟 LINE 通知功能</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationSectionUI; 