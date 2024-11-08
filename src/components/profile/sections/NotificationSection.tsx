import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faSpinner,
  faEnvelope,
  faDesktop,
  faMobile,
  faInfoCircle,
  faCopy,
} from '@fortawesome/free-solid-svg-icons';
import { faLine } from '@fortawesome/free-brands-svg-icons';
import LineVerification from '../line/LineVerification';
import { User } from '../../../types/userType';
import { NotificationSettings } from '../../../types/profileTypes';
import { lineConfig } from '../../../config/line';
import { Switch } from '@mui/material';
import { VerificationStep } from '../../../types/lineTypes';
import { toast } from 'react-toastify';

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

          {/* 新增：用戶 ID 顯示區塊 */}
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
          
          {/* 驗證流程說明 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-gray-700 mb-4">
              <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 text-xl" />
              <h3 className="font-medium text-lg">驗證流程說明</h3>
            </div>
            
            <div className="space-y-6">
              {/* 步驟 1 */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">加入 LINE 官方帳號</h4>
                  <p className="text-gray-600 mb-2">
                    掃描下方 QR Code 或點擊「加入好友」按鈕，將我們的 LINE 官方帳號加為好友
                  </p>
                  <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-gray-50 rounded-lg">
                    <div className="qr-code-container bg-white p-3 rounded-lg shadow-sm">
                      <img 
                        src="/Line-QR-Code.png"
                        alt="LINE QR Code" 
                        className="w-24 h-24"
                      />
                    </div>
                    <a
                      href={`https://line.me/R/ti/p/${lineConfig.basicId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-[#00B900] text-white rounded-lg hover:bg-[#009900] transition-colors"
                    >
                      <FontAwesomeIcon icon={faLine} className="mr-2" />
                      加入好友
                    </a>
                  </div>
                </div>
              </div>

              {/* 步驟 2 */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">取得 LINE ID</h4>
                  <p className="text-gray-600 mb-2">
                    在 LINE 聊天室中輸入「驗證」，機器人會回傳您的 LINE ID
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-700">
                      <FontAwesomeIcon icon={faLine} className="text-[#00B900]" />
                      <span className="font-mono bg-white px-2 py-1 rounded">驗證</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 步驟 3 */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">輸入 LINE ID</h4>
                  <p className="text-gray-600 mb-2">
                    將機器人回傳的 LINE ID 複製並貼到下方的輸入欄位中
                  </p>
                  <div className="flex flex-col space-y-2">
                    <input
                      id="lineId"
                      type="text"
                      value={lineId}
                      onChange={(e) => setLineId(e.target.value)}
                      placeholder="請輸入您的 LINE ID"
                      className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={startVerification}
                      disabled={!lineId || isLoading}
                      className={`px-4 py-2 rounded-lg text-white transition-colors ${
                        !lineId || isLoading 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                          驗證中...
                        </>
                      ) : (
                        '開始驗證'
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 步驟 4 */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">完成驗證</h4>
                  <p className="text-gray-600">
                    輸入 LINE ID 後，系統會發送驗證碼到您的 LINE。請將收到的驗證碼輸入到驗證欄位中完成設定。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* LINE 驗證組件 */}
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