import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faSpinner,
  faEnvelope,
  faDesktop,
  faMobile,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { faLine } from '@fortawesome/free-brands-svg-icons';
import LineVerification from '../line/LineVerification';
import { User } from '../../../types/userType';
import { NotificationSettings } from '../../../types/profileTypes';
import { lineConfig } from '../../../config/line';
import { Switch } from '@mui/material';
import { VerificationStep } from '../../../types/lineTypes';

interface NotificationSectionProps {
  user: User | null;
  verificationState: {
    step: VerificationStep;
    status?: 'error';
    message?: string;
  };
  lineId: string;
  setLineId: (value: string) => void;
  startVerification: () => void;
  isLoading: boolean;
  checkLineFollowStatus: () => void;
  notificationSettings: NotificationSettings;
  handleNotificationChange: (setting: keyof NotificationSettings) => void;
  confirmVerificationCode: () => void;
}

const NotificationSection: React.FC<NotificationSectionProps> = ({
  user,
  verificationState,
  lineId,
  setLineId,
  startVerification,
  isLoading,
  checkLineFollowStatus,
  notificationSettings,
  handleNotificationChange,
  confirmVerificationCode
}) => {
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
          
          {/* 步驟說明 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500" />
              <span className="font-medium">設定步驟</span>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 ml-4">
              <li>掃描下方 QR Code 加入官方帳號為好友</li>
              <li>在 LINE 上輸入「驗證」取得 LINE ID</li>
              <li>將 LINE ID 填入下方欄位進行驗證</li>
            </ol>
          </div>
          
          {/* LINE QR Code 區塊 */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-8 p-6 bg-gray-50 rounded-lg">
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-medium text-lg mb-2">加入 LINE 官方帳號</h3>
              <p className="text-gray-600 mb-4">請掃描 QR Code 加入好友以接收通知</p>
              <a
                href={`https://line.me/R/ti/p/${lineConfig.basicId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-2.5 bg-[#00B900] text-white rounded-lg hover:bg-[#009900] transition-colors"
              >
                <FontAwesomeIcon icon={faLine} className="mr-2" />
                加入好友
              </a>
            </div>
            
            <div className="qr-code-container bg-white p-4 rounded-lg shadow-sm">
              <img 
                src="/Line-QR-Code.png"
                alt="LINE QR Code" 
                className="w-32 h-32 md:w-40 md:h-40"
              />
            </div>
          </div>

          {/* LINE 驗證組件 */}
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label htmlFor="lineId" className="font-medium text-gray-700">
                LINE ID
              </label>
              <input
                id="lineId"
                type="text"
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                placeholder="請輸入您的 LINE ID"
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <LineVerification
              verificationState={verificationState}
              lineId={lineId}
              setLineId={setLineId}
              startVerification={startVerification}
              user={user}
              checkLineFollowStatus={checkLineFollowStatus}
              confirmVerificationCode={confirmVerificationCode}
            />
          </div>
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