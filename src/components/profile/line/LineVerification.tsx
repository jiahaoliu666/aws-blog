import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, 
  faExclamationCircle, 
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { faLine } from '@fortawesome/free-brands-svg-icons';
import { lineConfig } from '@/config/line';
import { VerificationStep } from '@/types/lineTypes';

interface LineVerificationProps {
  verificationState: {
    step: VerificationStep;
    status: string;
    message?: string;
    isVerified?: boolean;
  };
  lineId: string;
  setLineId: (value: string) => void;
  verificationCode: string;
  setVerificationCode: (value: string) => void;
  verifyLineIdAndCode: () => void;
  userId: string;
  onCopyUserId: () => void;
}

const LineVerification: React.FC<LineVerificationProps> = ({
  verificationState,
  lineId,
  setLineId,
  verificationCode,
  setVerificationCode,
  verifyLineIdAndCode,
  userId,
  onCopyUserId,
}) => {
  return (
    <div className="space-y-6">
      {/* 步驟 1: 加入好友 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
            1
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-800 mb-2">加入 LINE 官方帳號</h4>
            <p className="text-gray-600 mb-4">
              掃描 QR Code 或點擊按鈕加入好友
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <img 
                  src="/Line-QR-Code.png"
                  alt="LINE QR Code" 
                  className="w-32 h-32"
                />
              </div>
              <a
                href={`https://line.me/R/ti/p/${lineConfig.basicId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-[#00B900] text-white rounded-lg hover:bg-[#009900] transition-colors"
              >
                <FontAwesomeIcon icon={faLine} className="mr-2" />
                加入好友
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 步驟 2: 輸入驗證資訊 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
            2
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-800 mb-2">輸入驗證資訊</h4>
            <p className="text-gray-600 mb-4">
              在 LINE 中輸入「驗證」取得 LINE ID 和驗證碼
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LINE ID
                </label>
                <input
                  type="text"
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  placeholder="請輸入 LINE ID"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  驗證碼
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="請輸入驗證碼"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={verifyLineIdAndCode}
                disabled={!lineId || !verificationCode || verificationState.status === 'validating'}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                  transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {verificationState.status === 'validating' ? '驗證中...' : '開始驗證'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 驗證狀態顯示 */}
      {verificationState.status === 'error' && (
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-red-600">
            <FontAwesomeIcon icon={faExclamationCircle} />
            <span>{verificationState.message || '驗證失敗'}</span>
          </div>
        </div>
      )}

      {verificationState.isVerified && (
        <div className="bg-green-50 p-6 rounded-lg text-center">
          <FontAwesomeIcon icon={faCheckCircle} className="text-4xl text-green-500 mb-3" />
          <h3 className="text-xl font-semibold text-green-600">驗證成功！</h3>
          <p className="text-green-600">您已成功開啟 LINE 通知功能</p>
        </div>
      )}

      {/* 說明區塊 */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mt-1" />
          <div>
            <h4 className="font-medium text-blue-800">注意事項</h4>
            <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm mt-2">
              <li>請確保已加入官方 LINE 帳號為好友</li>
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