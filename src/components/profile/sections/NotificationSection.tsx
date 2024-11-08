import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faSpinner,
  faEnvelope,
  faDesktop,
  faMobile,
  // 移除這行，因為我們要使用 brands 版本的 LINE 圖標
  // faLine 
} from '@fortawesome/free-solid-svg-icons';
import { faLine } from '@fortawesome/free-brands-svg-icons';
import LineVerification from '../line/LineVerification';
import { User } from '../../../types/userType';
import { NotificationSettings } from '../../../types/profileTypes';
import { lineConfig } from '../../../config/line';

interface NotificationSectionProps {
  user: User | null;
  verificationState: string;
  lineId: string;
  setLineId: (value: string) => void;
  startVerification: () => void;
  isLoading: boolean;
  checkLineFollowStatus: () => void;
  notificationSettings: NotificationSettings;
  handleNotificationChange: (setting: keyof NotificationSettings) => void;
}

const NotificationSection: React.FC<NotificationSectionProps> = ({
  user,
  verificationState,
  lineId,
  setLineId,
  startVerification,
  isLoading,
  checkLineFollowStatus,
  notificationSettings = {
    email: false,
    browser: false,
    mobile: false,
    line: false
  },
  handleNotificationChange
}) => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 border-b pb-4">訂閱通知</h1>

      <div className="space-y-6">
        {/* LINE 通知設定 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">LINE 通知設定</h2>
          
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

          <LineVerification
            verificationState={verificationState}
            lineId={lineId}
            setLineId={setLineId}
            startVerification={startVerification}
            user={user}
            checkLineFollowStatus={checkLineFollowStatus}
          />
        </div>

        {/* 其他通知設定 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
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
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationSettings.email}
                  onChange={() => handleNotificationChange('email')}
                  disabled={isLoading}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center">
            <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500 text-2xl" />
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-800 mb-2">通知說明</h3>
          <ul className="list-disc list-inside text-blue-700 space-y-2">
            <li>電子郵件通知：系統將發送重要更新和活動提醒至您的信箱</li>
            <li>LINE 通知：需要先完成 LINE 帳號綁定才能啟用</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificationSection; 