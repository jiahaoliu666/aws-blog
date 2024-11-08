import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck, 
  faSpinner, 
  faCheckCircle, 
  faExclamationCircle, 
  faInfoCircle, 
  faIdCard 
} from '@fortawesome/free-solid-svg-icons';
import StepIndicator from '../common/StepIndicator';
import { User } from '../../../types/userType';
import { VerificationStep } from '../../../types/profileTypes';

interface LineVerificationProps {
  verificationState: {
    step: VerificationStep;
    status?: 'error';
    message?: string;
  };
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
  const [verificationCode, setVerificationCode] = useState('');

  return (
    <div className="space-y-6">
      <StepIndicator step={verificationState.step} />

      {verificationState.step === 'idle' && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <FontAwesomeIcon icon={faIdCard} className="text-blue-500 text-xl" />
              <h3 className="font-medium text-lg">輸入 LINE ID</h3>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                placeholder="請輸入您的 LINE ID"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => checkLineFollowStatus?.(lineId)}
                className="w-full px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                disabled={!lineId}
              >
                <FontAwesomeIcon icon={faCheck} />
                開始驗證
              </button>
            </div>
          </div>
        </div>
      )}

      {verificationState.step === 'verifying' && (
        <div className="space-y-4">
          <div className="bg-yellow-50 p-6 rounded-lg">
            <div className="flex items-start gap-3">
              <FontAwesomeIcon icon={faInfoCircle} className="text-yellow-500 mt-1" />
              <div>
                <h3 className="font-medium text-lg text-yellow-700 mb-2">請在 LINE 上完成驗證</h3>
                <ol className="list-decimal list-inside space-y-2 text-yellow-600">
                  <li>打開 LINE 應用程式</li>
                  <li>在官方帳號對話框中輸入「驗證」</li>
                  <li>複製機器人回傳的驗證碼</li>
                  <li>將驗證碼輸入下方欄位</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="請輸入驗證碼"
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => confirmVerificationCode(verificationCode)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              disabled={!verificationCode}
            >
              確認驗證
            </button>
          </div>
        </div>
      )}

      {verificationState.step === 'complete' && (
        <div className="text-center space-y-4">
          <div className="bg-green-50 p-6 rounded-lg">
            <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-500 mb-3" />
            <h3 className="text-xl font-semibold text-green-600">驗證成功！</h3>
            <p className="text-green-600">您已成功開啟 LINE 通知功能</p>
          </div>
        </div>
      )}

      {verificationState.status === 'error' && (
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-red-600">
            <FontAwesomeIcon icon={faExclamationCircle} />
            <span>{verificationState.message || '驗證過程發生錯誤'}</span>
          </div>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-start">
          <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mt-1 mr-3" />
          <div>
            <h4 className="font-medium">注意事項</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
              <li>請確保您已加入官方 LINE 好友</li>
              <li>驗證碼有效期為 5 分鐘</li>
              <li>如遇問題請重新開始驗證流程</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineVerification; 