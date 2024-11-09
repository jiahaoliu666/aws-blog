import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { VerificationStep } from '@/types/lineTypes';

interface LineVerificationProps {
  verificationState: {
    step: VerificationStep;
    status: string;
    message?: string;
    isVerified?: boolean;
  };
  lineId: string;
  setLineId: (id: string) => void;
  verificationCode: string;
  setVerificationCode: (value: string) => void;
  verifyLineIdAndCode: () => void;
  onCopyUserId: () => void;
  userId: string;
}

const LineVerification: React.FC<LineVerificationProps> = ({
  verificationState,
  lineId,
  setLineId,
  verificationCode,
  setVerificationCode,
  verifyLineIdAndCode,
  onCopyUserId,
  userId
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="lineId" className="font-medium text-gray-700">
          LINE ID
        </label>
        <input
          id="lineId"
          type="text"
          value={lineId}
          onChange={(e) => setLineId(e.target.value)}
          placeholder="請輸入您的 LINE ID"
          className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <button
        onClick={verifyLineIdAndCode}
        disabled={verificationState.isVerified}
        className={`w-full py-2 px-4 rounded-md text-white font-medium
          ${verificationState.isVerified 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {verificationState.isVerified ? '處理中...' : '儲存 LINE ID'}
      </button>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mt-1" />
          <div>
            <h4 className="font-medium text-blue-800">如何取得 LINE ID？</h4>
            <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm mt-2">
              <li>開啟 LINE 應用程式</li>
              <li>點擊「設定」</li>
              <li>選擇「個人檔案」</li>
              <li>您的 LINE ID 格式為 U 開頭加上 32 位英數字元</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineVerification; 