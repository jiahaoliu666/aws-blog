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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
                  <FontAwesomeIcon icon={faEnvelope} className="text-xl text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">電子郵件通知</h3>
                  <p className="text-sm text-gray-600">接收最新消息和重要更新</p>
                </div>
              </div>
              <Switch
                checked={notificationSettings.email}
                onChange={() => handleNotificationChange('email')}
                color="primary"
              />
            </div>

            <div className="border-t border-gray-100"></div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  通知接收信箱
                </label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                  已驗證
                </span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  value={formData?.email || ''}
                  readOnly
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 
                    rounded-lg text-gray-700 text-sm focus:outline-none cursor-not-allowed
                    transition duration-150 ease-in-out"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-gray-400" />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                此信箱與您的帳號綁定
              </p>
            </div>
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