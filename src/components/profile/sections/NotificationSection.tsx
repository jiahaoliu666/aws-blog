import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faInfoCircle,
  faCopy,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons';
import { faLine } from '@fortawesome/free-brands-svg-icons';
import { Switch } from '@mui/material';
import { toast } from 'react-toastify';
import LineVerification from '../line/LineVerification';
import { NotificationSectionProps } from '@/types/profileTypes';
import { VerificationStep } from '@/types/lineTypes';

// 功能性組件
const NotificationSection: React.FC<NotificationSectionProps> = ({
  user,
  verificationState,
  lineId,
  setLineId,
  verificationCode,
  setVerificationCode,
  verifyLineIdAndCode,
  isLoading,
  notificationSettings,
  handleNotificationChange,
}) => {
  const verificationStateObject = verificationState;

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

          {/* 用戶 ID 顯示區塊 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mt-1" />
              <div>
                <h3 className="font-medium text-gray-700 mb-2">您的用戶 ID</h3>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-3 py-1 rounded border text-blue-600 font-mono select-all">
                    {user?.sub || '未登入'}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user?.sub || '');
                      toast.success('已複製用戶 ID');
                    }}
                    className="text-sm px-2 py-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <FontAwesomeIcon icon={faCopy} className="mr-1" />
                    複製
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  請在 LINE 上輸入「驗證」取得 LINE ID，並將其填入下方欄位
                </p>
              </div>
            </div>
          </div>

          {/* LINE 驗證組件 */}
          <LineVerification
            verificationState={verificationStateObject}
            lineId={lineId || ''}
            setLineId={setLineId}
            verificationCode={verificationCode || ''}
            setVerificationCode={setVerificationCode}
            verifyLineIdAndCode={verifyLineIdAndCode}
          />
        </div>

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

export default NotificationSection; 