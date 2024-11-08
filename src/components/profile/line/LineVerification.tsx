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
  confirmVerificationCode: (code: string) => void;
}

const LineVerification: React.FC<LineVerificationProps> = ({
  verificationState,
  lineId,
  setLineId,
  startVerification,
  user,
  checkLineFollowStatus,
  confirmVerificationCode
}) => {
  const [verificationCode, setVerificationCode] = React.useState('');

  return (
    <div className="space-y-6">
      <StepIndicator step={verificationState as VerificationStep} />

      {verificationState === 'idle' && (
        <div className="text-center space-y-4">
          <div className="bg-gray-50 p-6 rounded-lg">
            <img 
              src="/images/line-qr.png" 
              alt="LINE QR Code" 
              className="mx-auto w-48 h-48 mb-4"
            />
            <div className="flex items-center justify-center space-x-4">
              <a
                href="https://line.me/R/ti/p/@XXX"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-[#00B900] text-white rounded-full hover:bg-[#009900] transition duration-200"
              >
                <img src="/images/line-icon.png" alt="LINE" className="w-5 h-5 mr-2" />
                加入 LINE 好友
              </a>
              <button
                onClick={() => checkLineFollowStatus && checkLineFollowStatus(user?.id || '')}
                className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-200"
              >
                已加入好友，下一步
              </button>
            </div>
          </div>
          
          <div className="mt-6 text-left">
            <h4 className="font-medium mb-2">溫馨提醒</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>加入好友後請勿封鎖或刪除，否則將無法接收通知</li>
              <li>若您已是好友，可直接點擊「下一步」</li>
              <li>遇到問題可以重新掃描 QR Code 或重新加入</li>
            </ul>
          </div>
        </div>
      )}

      {verificationState === 'verifying' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium mb-4">輸入驗證碼</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="請輸入 6 位數驗證碼"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => confirmVerificationCode(verificationCode)}
                disabled={!verificationCode}
                className={`w-full py-3 rounded-full text-white transition duration-200 ${
                  verificationCode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                確認驗證
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
            className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-200"
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