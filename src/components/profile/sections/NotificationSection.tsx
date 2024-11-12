import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faInfoCircle,
  faCopy,
  faEnvelope,
  faExclamationCircle,
  faCheckCircle,
  faSave,
} from '@fortawesome/free-solid-svg-icons';
import { faLine } from '@fortawesome/free-brands-svg-icons';
import { Switch } from '@mui/material';
import { toast } from 'react-toastify';
import { NotificationSectionProps } from '@/types/profileTypes';
import { VerificationStep, VerificationStatus } from '@/types/lineTypes';
import { useLineVerification } from '@/hooks/line/useLineVerification';
import { useAuthContext } from '@/context/AuthContext';
import { logger } from '@/utils/logger';
import { Transition } from '@headlessui/react';
import { useNotificationSettings } from '@/hooks/profile/useNotificationSettings';

// 純 UI 組件
const NotificationSectionUI: React.FC<NotificationSectionProps> = ({
  notificationSettings,
  handleNotificationChange,
  isLoading,
  saveAllSettings,
  formData,
}) => {
  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">通知設定</h1>
        <p className="mt-2 text-gray-600">管理您想要接收的通知方式</p>
      </div>

      {/* 只顯示 email 和 line 的開關 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <FontAwesomeIcon icon={faEnvelope} className="text-xl text-blue-500" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">電子郵件通知</h3>
                  <p className="text-sm text-gray-600">接收最新消息和重要更新</p>
                  <div className="mt-2">
                    <input
                      type="email"
                      value={formData?.email || ''}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg 
                        text-gray-700 text-sm focus:outline-none cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
            <Switch
              checked={notificationSettings.email}
              onChange={() => handleNotificationChange('email')}
              color="primary"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faLine} className="text-xl text-[#00B900]" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">LINE 通知</h3>
                <p className="text-sm text-gray-600">透過 LINE 接收即時通知</p>
              </div>
            </div>
            <Switch
              checked={notificationSettings.line}
              onChange={() => handleNotificationChange('line')}
              color="primary"
            />
          </div>
        </div>
      </div>

      {/* 儲存按鈕 */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={saveAllSettings}
          disabled={isLoading}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     disabled:opacity-50 disabled:cursor-not-allowed 
                     transition-colors duration-200 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⌛</span>
              儲存中...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faSave} className="mr-2" />
              儲存設定
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationSectionUI; 