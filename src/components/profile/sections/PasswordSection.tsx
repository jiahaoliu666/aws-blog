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
import { UseProfilePasswordReturn } from '@/hooks/profile/useProfilePassword';
import { useToastContext } from '@/context/ToastContext';
import { useProfileActivity } from '@/hooks/profile/useProfileActivity';
import { SectionTitle } from '../common/SectionTitle';
import { Card } from '../common/Card';

interface PasswordSectionProps {
  user: any;
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
  areAllPasswordFieldsEmpty: () => boolean;
  checkPasswordRequirements: (password: string) => {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumbers: boolean;
    hasSpecialChar: boolean;
    passwordsMatch: boolean;
  };
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

const PasswordSection: React.FC<UseProfilePasswordReturn> = ({
  user,
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
  setConfirmPassword,
  areAllPasswordFieldsEmpty,
  checkPasswordRequirements,
}) => {
  const { toast } = useToastContext();
  const { addActivityLog } = useProfileActivity({ user });
  
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

  useEffect(() => {
    if (passwordMessage) {
      const isSuccess = passwordMessage.includes('成功');
      toast({
        message: passwordMessage,
        type: isSuccess ? 'success' : 'error'
      });
    }
  }, [passwordMessage, toast]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleChangePassword();
  };

  const requirements = checkPasswordRequirements(newPassword);

  return (
    <div className="w-full">
      <div className="mb-8">
        <SectionTitle 
          title="修改密碼"
          description="請定期更新您的密碼以確保帳號安全"
        />
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-6">
        {/* 密碼修改表單 */}
        <Card>
          <div className="p-6 space-y-8">
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

            {/* 按鈕群組 */}
            <div className="flex justify-end gap-3 pt-4">
              {!areAllPasswordFieldsEmpty() && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2.5 rounded-lg text-gray-700 border border-gray-200
                    hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  取消
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className={`
                  px-6 py-2.5 rounded-lg flex items-center gap-2
                  ${isLoading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }
                  transition-all duration-200
                `}
              >
                <FontAwesomeIcon icon={faKey} />
                {isLoading ? '更新中...' : '更新密碼'}
              </button>
            </div>
          </div>
        </Card>

        {/* 密碼要求說明區塊 */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <FontAwesomeIcon icon={faShieldAlt} className="text-blue-500 text-xl" />
              <h3 className="font-medium text-gray-800 text-lg">密碼要求與安全提示</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 基本要求 */}
              <div>
                <h4 className="text-sm font-medium text-gray-800 mb-4">基本要求</h4>
                <ul className="space-y-3 text-sm text-gray-600">
                  
                  <li className="flex items-center gap-2">
                    <FontAwesomeIcon 
                      icon={requirements.minLength ? faCheckCircle : faTimesCircle} 
                      className={requirements.minLength ? "text-blue-500" : "text-red-500"} 
                    />
                    <span>至少 8 個字符</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FontAwesomeIcon 
                      icon={requirements.hasUpperCase ? faCheckCircle : faTimesCircle} 
                      className={requirements.hasUpperCase ? "text-blue-500" : "text-red-500"} 
                    />
                    <span>包含大寫字母</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FontAwesomeIcon 
                      icon={requirements.hasLowerCase ? faCheckCircle : faTimesCircle} 
                      className={requirements.hasLowerCase ? "text-blue-500" : "text-red-500"} 
                    />
                    <span>包含小寫字母</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FontAwesomeIcon 
                      icon={requirements.hasNumbers ? faCheckCircle : faTimesCircle} 
                      className={requirements.hasNumbers ? "text-blue-500" : "text-red-500"} 
                    />
                    <span>包含數字</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FontAwesomeIcon 
                      icon={requirements.hasSpecialChar ? faCheckCircle : faTimesCircle} 
                      className={requirements.hasSpecialChar ? "text-blue-500" : "text-red-500"} 
                    />
                    <span>包含特殊字符</span>
                  </li>
                  
                  <li className="flex items-center gap-2">
                    <FontAwesomeIcon 
                      icon={requirements.passwordsMatch ? faCheckCircle : faTimesCircle} 
                      className={requirements.passwordsMatch ? "text-blue-500" : "text-red-500"} 
                    />
                    <span>新密碼與確認密碼一致</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FontAwesomeIcon 
                      icon={oldPassword !== newPassword ? faCheckCircle : faTimesCircle} 
                      className={oldPassword !== newPassword ? "text-blue-500" : "text-red-500"} 
                    />
                    <span>新密碼不能與當前密碼相同</span>
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
                    <span>建議定期換密碼以提高帳號安全性</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-blue-500 mt-1 flex-shrink-0" />
                    <span>請勿在不同網站使用相同的密碼</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* 提示訊息 */}
        {passwordMessage && (
          <div className={`p-4 rounded-lg ${
            passwordMessage.includes('成功') 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <p className="text-sm">{passwordMessage}</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default PasswordSection;