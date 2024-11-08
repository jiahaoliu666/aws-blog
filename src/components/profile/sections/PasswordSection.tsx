import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLock, 
  faEye, 
  faEyeSlash, 
  faCheckCircle, 
  faTimesCircle 
} from '@fortawesome/free-solid-svg-icons';

interface PasswordSectionProps {
  oldPassword: string;
  setOldPassword: (password: string) => void;
  showOldPassword: boolean;
  setShowOldPassword: (show: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (show: boolean) => void;
  formData: {
    password?: string;
    confirmPassword?: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  calculatePasswordStrength: (password: string) => number;
  handleChangePassword: () => void;
  handleClosePasswordModal: () => void;
  resetPasswordFields: () => void;
  isLoading: boolean;
  passwordMessage?: string;
  newPassword: string;
  setNewPassword: (password: string) => void;
}

const PasswordSection: React.FC<PasswordSectionProps> = ({
  oldPassword,
  setOldPassword,
  showOldPassword,
  setShowOldPassword,
  showNewPassword,
  setShowNewPassword,
  formData,
  handleChange,
  calculatePasswordStrength,
  handleChangePassword,
  isLoading,
  passwordMessage,
  newPassword,
  setNewPassword
}) => {
  const passwordStrength = formData.password ? calculatePasswordStrength(formData.password) : 0;
  const getStrengthColor = (strength: number) => {
    if (strength < 30) return 'bg-red-500';
    if (strength < 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-800 border-b pb-4 mb-6">修改密碼</h1>

      <div className="space-y-6">
        {/* 當前密碼 */}
        <div className="relative">
          <label className="block text-gray-700 font-medium mb-2">當前密碼</label>
          <div className="relative">
            <input
              type={showOldPassword ? 'text' : 'password'}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="請輸入當前密碼"
            />
            <button
              type="button"
              onClick={() => setShowOldPassword(!showOldPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <FontAwesomeIcon icon={showOldPassword ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

        {/* 新密碼 */}
        <div className="relative">
          <label className="block text-gray-700 font-medium mb-2">新密碼</label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              name="password"
              value={formData.password || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="請輸入新密碼"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
            </button>
          </div>
          {formData.password && (
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                  style={{ width: `${passwordStrength}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-sm">
                <span className={passwordStrength < 30 ? 'text-red-500' : 'text-gray-500'}>弱</span>
                <span className={passwordStrength >= 30 && passwordStrength < 60 ? 'text-yellow-500' : 'text-gray-500'}>中</span>
                <span className={passwordStrength >= 60 ? 'text-green-500' : 'text-gray-500'}>強</span>
              </div>
            </div>
          )}
        </div>

        {/* 確認新密碼 */}
        <div className="relative">
          <label className="block text-gray-700 font-medium mb-2">確認新密碼</label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="請再次輸入新密碼"
            />
          </div>
          {formData.password && formData.confirmPassword && (
            <div className="flex items-center mt-2 text-sm">
              <FontAwesomeIcon 
                icon={formData.password === formData.confirmPassword ? faCheckCircle : faTimesCircle}
                className={formData.password === formData.confirmPassword ? 'text-green-500' : 'text-red-500'}
              />
              <span className={`ml-2 ${
                formData.password === formData.confirmPassword ? 'text-green-500' : 'text-red-500'
              }`}>
                {formData.password === formData.confirmPassword ? '密碼匹配' : '密碼不匹配'}
              </span>
            </div>
          )}
        </div>

        {/* 密碼要求說明 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">密碼要求</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>至少 8 個字符</li>
            <li>包含大小寫字母</li>
            <li>包含數字</li>
            <li>包含特殊字符</li>
          </ul>
        </div>

        {/* 提交按鈕 */}
        <div className="flex justify-end">
          <button 
            onClick={handleChangePassword} 
            className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition duration-200" 
            disabled={isLoading}
          >
            {isLoading ? '保存中...' : '更改密碼'}
          </button>
        </div>

        {/* 提示訊息 */}
        {passwordMessage && (
          <div className={`mt-4 mb-6 p-4 rounded-lg shadow-md ${
            passwordMessage.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {passwordMessage}
          </div>
        )}
      </div>
    </>
  );
};

export default PasswordSection;