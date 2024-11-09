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
import { useLineVerification } from '@/hooks/line/useLineVerification';
import { useAuthContext } from '@/context/AuthContext';
import { logger } from '@/utils/logger';

// 純 UI 組件
const NotificationSectionUI: React.FC<NotificationSectionProps> = ({
  verificationState,
  lineId,
  setLineId,
  verificationCode,
  setVerificationCode,
  verifyLineIdAndCode,
  onCopyUserId,
  userId,
  notificationSettings,
  handleNotificationChange,
  isLoading,
  isVerifying,
  formData = { email: '', username: '' },
}) => {
  const { user } = useAuthContext();
  const { handleVerification, verificationState: lineVerificationState } = useLineVerification({
    user,
    updateUserLineSettings: async (settings) => {
      try {
        // 實作更新設定的邏輯
        logger.info('更新 LINE 設定', settings);
      } catch (error) {
        logger.error('更新 LINE 設定失敗:', error);
      }
    }
  });

  const onVerifyClick = async () => {
    logger.info('驗證按鈕被點擊');
    try {
      await handleVerification();
    } catch (error) {
      logger.error('驗證處理失敗:', error);
    }
  };

  // 渲染驗證狀態提示
  const renderVerificationStatus = () => {
    if (lineVerificationState.status === VerificationStatus.ERROR) {
      return (
        <div className="bg-red-50 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2 text-red-600">
            <FontAwesomeIcon icon={faExclamationCircle} />
            <span>{lineVerificationState.message || '驗證失敗'}</span>
          </div>
        </div>
      );
    }

    if (lineVerificationState.isVerified) {
      return (
        <div className="bg-green-50 p-6 rounded-lg text-center mb-6">
          <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-500 mb-3" />
          <h3 className="text-xl font-semibold text-green-600">驗證成功！</h3>
          <p className="text-green-600">您已成功開啟 LINE 通知功能</p>
        </div>
      );
    }

    return null;
  };

  // 渲染進度指示器
  const renderProgressStatus = () => {
    const steps = [
      { 
        label: '準備開始', 
        description: '複製您的用戶ID',
        completed: lineVerificationState.step !== VerificationStep.IDLE 
      },
      { 
        label: '加入並驗證',
        description: '加入官方帳號並完成驗證',
        completed: lineVerificationState.step >= VerificationStep.VERIFYING 
      },
      {
        label: '綁定成功',
        description: '開始接收 LINE 通知',
        completed: lineVerificationState.isVerified
      }
    ];

    return (
      <div className="relative mb-8">
        {/* 進度條背景 */}
        <div className="absolute top-6 left-0 w-full h-1 bg-gray-200"></div>
        {/* 完成的進度 */}
        <div 
          className="absolute top-6 left-0 h-1 bg-green-500 transition-all duration-500"
          style={{ 
            width: `${(Number(lineVerificationState.step) / (Object.keys(VerificationStep).length)) * 100}%` 
          }}
        ></div>
        
        <div className="flex justify-between relative">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center" style={{ width: '25%' }}>
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center
                transition-all duration-300 mb-3 relative z-10
                ${step.completed 
                  ? 'bg-green-500 text-white shadow-lg scale-110' 
                  : 'bg-white border-2 border-gray-300 text-gray-500'
                }
              `}>
                {step.completed ? (
                  <FontAwesomeIcon icon={faCheckCircle} className="text-lg" />
                ) : (
                  <span className="font-semibold">{index + 1}</span>
                )}
              </div>
              <span className={`
                text-sm font-medium text-center transition-colors duration-300 mb-1
                ${step.completed ? 'text-green-600' : 'text-gray-700'}
              `}>
                {step.label}
              </span>
              <span className="text-xs text-gray-500 text-center">
                {step.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-800 border-b pb-4 mb-6">訂閱通知</h1>

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
              {lineVerificationState.isVerified && (
                <Switch
                  checked={notificationSettings.line}
                  onChange={() => handleNotificationChange('line')}
                  disabled={isLoading}
                />
              )}
            </div>

            {/* 驗證狀態提示 */}
            {renderVerificationStatus()}

            {/* 進度指示器 */}
            {!lineVerificationState.isVerified && renderProgressStatus()}

            {/* 驗證步驟內容 */}
            {!lineVerificationState.isVerified ? (
              <div className="space-y-8">
                {/* 步驟 1: 用戶ID */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium">1</span>
                    <h3 className="text-lg font-semibold">複製您的用戶ID</h3>
                  </div>
                  <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                    <span className="text-gray-600 font-mono">{userId}</span>
                    <button
                      onClick={onCopyUserId}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <FontAwesomeIcon icon={faCopy} />
                      <span>複製</span>
                    </button>
                  </div>
                </div>

                {/* 步驟 2: 加入官方帳號 */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium">2</span>
                    <h3 className="text-lg font-semibold">加入官方帳號</h3>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* QR Code 區塊 */}
                    <div className="flex-1 text-center">
                      <div className="bg-white p-4 rounded-lg inline-block shadow-md mb-3">
                        <img 
                          src="/line-qr-code.png" 
                          alt="LINE 官方帳號 QR Code" 
                          className="w-48 h-48 object-contain"
                        />
                      </div>
                      <p className="text-sm text-gray-600">掃描 QR Code 加入好友</p>
                    </div>

                    {/* 分隔線 */}
                    <div className="flex items-center justify-center md:h-48">
                      <div className="hidden md:block w-px h-full bg-gray-300"></div>
                      <div className="md:hidden h-px w-full bg-gray-300"></div>
                      <div className="absolute text-gray-500 bg-gray-50 px-4">或</div>
                    </div>

                    {/* 按鈕區塊 */}
                    <div className="flex-1 text-center">
                      <div className="space-y-4">
                        <a
                          href="https://line.me/R/ti/p/@601feiwz"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 bg-[#00B900] text-white px-6 py-3 rounded-lg hover:bg-[#009900] transition-colors"
                        >
                          <FontAwesomeIcon icon={faLine} className="text-xl" />
                          <span>點擊加入好友</span>
                        </a>
                        <p className="text-sm text-gray-600">
                          <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-gray-400" />
                          建議使用手機開啟
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 提示訊息 */}
                  <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mt-1" />
                      <div>
                        <p className="text-sm text-blue-700">加入好友後：</p>
                        <ol className="mt-2 text-sm text-blue-600 list-decimal list-inside space-y-1">
                          <li>在 LINE 聊天室輸入「您的用戶ID」</li>
                          <li>系統會回傳您的 LINE ID 和驗證碼</li>
                          <li>將資訊填入下方表單完成驗證</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 步驟 3: 驗證資訊輸入 */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium">3</span>
                    <h3 className="text-lg font-semibold">輸入驗證資訊</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        LINE ID
                      </label>
                      <input
                        type="text"
                        value={lineId}
                        onChange={(e) => setLineId(e.target.value)}
                        placeholder="請輸入LINE回傳的ID"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={lineVerificationState.isVerified}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        驗證碼
                      </label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="請輸入LINE回傳的驗證碼"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={lineVerificationState.isVerified}
                      />
                    </div>
                    <button
                      onClick={onVerifyClick}
                      disabled={isVerifying}
                      className={`
                        w-full py-3 rounded-lg transition-colors
                        ${(!lineId || !verificationCode || lineVerificationState.isVerified || isVerifying)
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }
                      `}
                    >
                      {isVerifying ? '驗證中...' : lineVerificationState.isVerified ? '已驗證' : '驗證'}
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