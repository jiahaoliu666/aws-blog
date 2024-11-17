import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLock, 
  faEye, 
  faEyeSlash, 
  faCheckCircle, 
  faTimesCircle,
  faShieldAlt,
  faKey
} from '@fortawesome/free-solid-svg-icons';

interface PasswordSectionProps {
  oldPassword: string;
  setOldPassword: (password: string) => void;
  newPassword: string;
  confirmPassword: string;
  showOldPassword: boolean;
  setShowOldPassword: (show: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  passwordMessage: string | null;
  isPasswordModalOpen: boolean;
  isLoading: boolean;
  handleChangePassword: () => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCancel: () => void;
  setNewPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
}

const calculatePasswordStrength = (password: string): number => {
  let score = 0;
  
  if (password.length >= 8) score += 20;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  
  return score;
};

const PasswordSection: React.FC<PasswordSectionProps> = ({
  oldPassword,
  setOldPassword,
  newPassword,
  confirmPassword,
  showOldPassword,
  setShowOldPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  passwordMessage,
  isPasswordModalOpen,
  isLoading,
  handleChangePassword,
  handleChange,
  handleCancel,
  setNewPassword,
  setConfirmPassword
}) => {
  const passwordStrength = newPassword ? calculatePasswordStrength(newPassword) : 0;
  
  const getStrengthColor = (strength: number) => {
    if (strength < 30) return 'bg-red-500';
    if (strength < 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength: number) => {
    if (strength < 30) return '弱';
    if (strength < 60) return '中';
    return '強';
  };

  useEffect(() => {
    return () => {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    };
  }, [setOldPassword, setNewPassword, setConfirmPassword]);

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">修改密碼</h1>
        <p className="mt-2 text-gray-600">請定期更新您的密碼以確保帳號安全</p>
      </div>

      {/* 密碼修改表單 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="p-8 space-y-8">
          {/* 當前密碼 */}
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium mb-1.5">當前密碼</label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                  transition duration-150"
                placeholder="請輸入當前密碼"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 
                  text-gray-400 hover:text-gray-600 transition duration-150"
              >
                <FontAwesomeIcon icon={showOldPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          {/* 新密碼 */}
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium mb-1.5">新密碼</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={newPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                  transition duration-150"
                placeholder="請輸入新密碼"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 
                  text-gray-400 hover:text-gray-600 transition duration-150"
              >
                <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            
            {/* 密碼強度指示器 */}
            {newPassword && (
              <div className="mt-4 space-y-2">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className={`${passwordStrength < 30 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>弱</span>
                  <span className={`${passwordStrength >= 30 && passwordStrength < 60 ? 'text-yellow-500 font-medium' : 'text-gray-400'}`}>中</span>
                  <span className={`${passwordStrength >= 60 ? 'text-green-500 font-medium' : 'text-gray-400'}`}>強</span>
                </div>
              </div>
            )}
          </div>

          {/* 確認新密碼 */}
          <div className="space-y-2">
            <label className="block text-gray-700 font-medium mb-1.5">確認新密碼</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                  transition duration-150"
                placeholder="請再次輸入新密碼"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 
                  text-gray-400 hover:text-gray-600 transition duration-150"
              >
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>
        </div>

        {/* 按鈕群組 */}
        <div className="flex justify-end px-8 pb-8 gap-3">
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 bg-gray-600 text-white rounded-lg 
                      hover:bg-gray-700 transition-colors duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            取消
          </button>
          <button
            onClick={handleChangePassword}
            disabled={isLoading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 
                      text-white rounded-lg transition-colors duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faKey} />
            {isLoading ? '更新中...' : '更新密碼'}
          </button>
        </div>
      </div>

      {/* 密碼要求說明區塊 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <FontAwesomeIcon icon={faShieldAlt} className="text-blue-600 text-xl" />
          <h3 className="font-medium text-gray-800 text-lg">密碼要求與安全提示</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 基本要求 */}
          <div>
            <h4 className="text-sm font-medium text-gray-800 mb-4">基本要求</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-blue-500 flex-shrink-0" />
                <span>至少 8 個字符</span>
              </li>
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-blue-500 flex-shrink-0" />
                <span>包含大小寫字母</span>
              </li>
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-blue-500 flex-shrink-0" />
                <span>包含數字</span>
              </li>
              <li className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-blue-500 flex-shrink-0" />
                <span>包含特殊字符</span>
              </li>
            </ul>
          </div>
          {/* 安全提示 */}
          <div>
            <h4 className="text-sm font-medium text-gray-800 mb-4">安全提示</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-blue-500 mt-1 flex-shrink-0" />
                <span>避免使用容易猜到的密碼，如生日、電話號碼等</span>
              </li>
              <li className="flex items-start gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-blue-500 mt-1 flex-shrink-0" />
                <span>建議定期��換密碼以提高帳號安全性</span>
              </li>
              <li className="flex items-start gap-2">
                <FontAwesomeIcon icon={faCheckCircle} className="text-blue-500 mt-1 flex-shrink-0" />
                <span>請勿在不同網站使用相同的密碼</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 提示訊息 */}
      {passwordMessage && (
        <div className={`mt-6 p-4 rounded-lg ${
          passwordMessage.includes('成功') 
            ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
            : 'bg-red-50 text-red-700 border-l-4 border-red-500'
        }`}>
          <p className="text-sm">{passwordMessage}</p>
        </div>
      )}
    </div>
  );
};

export default PasswordSection;