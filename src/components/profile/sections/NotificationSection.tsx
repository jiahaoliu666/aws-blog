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
import LineVerification from '../line/LineVerification';
import { NotificationSectionProps } from '@/types/profileTypes';
import { VerificationStep } from '@/types/lineTypes';

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

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 border-b pb-4">訂閱通知</h1>

      <div className="space-y-6">
        {/* LINE 通知設定 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faLine} className="text-[#00B900]" />
            LINE 通知設定
          </h2>

          {/* 驗證表單 */}
          <LineVerification
            verificationState={{
              ...verificationState,
              progress: verificationState.step === VerificationStep.COMPLETE ? 100 : 50
            }}
            lineId={lineId || ''}
            setLineId={setLineId}
            verificationCode={verificationCode || ''}
            setVerificationCode={setVerificationCode}
            verifyLineIdAndCode={handleVerification}
            onCopyUserId={onCopyUserId}
            userId={userId}
          />
        </div>

        {renderVerificationStatus()}

        {/* 其他通知設定 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">其他通知設定</h2>
          <div className="space-y-4">
            {/* 電子郵件通知 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faEnvelope} className="text-gray-600 mr-3" />
                <div>
                  <h3 className="font-medium">電子郵件通知</h3>
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

        {/* 通知說明 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
            通知說明
          </h3>
          <ul className="list-disc list-inside text-blue-700 space-y-2">
            <li>LINE 通知：即時接收最新文章和重要更新</li>
            <li>電子郵件通知：系統將發送重要更新和活動提醒至您的信箱</li>
            <li>您可以隨時在此頁面調整通知設定</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificationSectionUI; 