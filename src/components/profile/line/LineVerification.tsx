import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck, 
  faSpinner, 
  faCheckCircle, 
  faExclamationCircle, 
  faInfoCircle 
} from '@fortawesome/free-solid-svg-icons';
import StepIndicator from '../common/StepIndicator';
import { User } from '../../../types/userType';
import { VerificationStep } from '../../../types/profileTypes';

interface LineVerificationProps {
  verificationState: string;
  lineId: string;
  setLineId: (value: string) => void;
  startVerification: () => void;
  user: User | null;
  checkLineFollowStatus?: (userId: string) => void;
}

const LineVerification: React.FC<LineVerificationProps> = ({
  verificationState,
  lineId,
  setLineId,
  startVerification,
  user,
  checkLineFollowStatus
}) => {
  return (
    <div className="space-y-6">
      <StepIndicator step={verificationState as VerificationStep} />

      {verificationState === 'idle' && (
        <div className="text-center space-y-4">
          <img 
            src="/images/line-qr.png" 
            alt="LINE QR Code" 
            className="mx-auto w-48 h-48"
          />
          <h3 className="text-xl font-semibold">第一步：加入官方 LINE 好友</h3>
          <p className="text-gray-600">掃描上方 QR Code 或點擊下方按鈕加入好友</p>
          <a
            href="https://line.me/R/ti/p/@XXX"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-500 text-white px-6 py-3 rounded-full hover:bg-green-600 transition duration-200"
          >
            加入 LINE 好友
          </a>
        </div>
      )}

      {verificationState === 'verifying' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">第二步：輸入您的 LINE ID</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                placeholder="請輸入您的 LINE ID"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={startVerification}
                disabled={!lineId}
                className={`w-full py-3 rounded-full text-white transition duration-200 ${
                  lineId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                開始驗證
              </button>
            </div>
          </div>
        </div>
      )}

      {verificationState === 'confirming' && (
        <div className="text-center space-y-4">
          <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-blue-500" />
          <h3 className="text-xl font-semibold">驗證中...</h3>
          <p className="text-gray-600">請稍候，我們正在驗證您的 LINE 帳號</p>
        </div>
      )}

      {verificationState === 'complete' && (
        <div className="text-center space-y-4">
          <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-500" />
          <h3 className="text-xl font-semibold text-green-600">驗證成功！</h3>
          <p className="text-gray-600">您的 LINE 帳號已成功綁定</p>
        </div>
      )}

      {verificationState === 'error' && (
        <div className="text-center space-y-4">
          <FontAwesomeIcon icon={faExclamationCircle} className="text-4xl text-red-500" />
          <h3 className="text-xl font-semibold text-red-600">驗證失敗</h3>
          <p className="text-gray-600">請確認您已加入官方 LINE 好友並重試</p>
          <button
            onClick={() => checkLineFollowStatus && checkLineFollowStatus(user?.id || '')}
            className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition duration-200"
          >
            重新驗證
          </button>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-start">
          <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mt-1 mr-3" />
          <div>
            <h4 className="font-medium">注意事項</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
              <li>請確保您已加入官方 LINE 好友</li>
              <li>LINE ID 通常可以在 LINE 應用程式的設定中找到</li>
              <li>綁定成功後，您將可以接收 LINE 通知</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineVerification; 