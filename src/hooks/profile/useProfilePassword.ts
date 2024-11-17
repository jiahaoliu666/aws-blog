import { useState, useEffect, useCallback } from 'react';
import { CognitoIdentityProviderClient, ChangePasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { User } from '@/types/userType';
import { useToastContext } from '@/context/ToastContext';
import { logger } from '@/utils/logger';
import { faKey } from '@fortawesome/free-solid-svg-icons';

interface UseProfilePasswordProps {
  user: User | null;
  handleLogout: () => void;
}

export const useProfilePassword = ({ user, handleLogout }: UseProfilePasswordProps) => {
  const { showToast } = useToastContext();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const cognitoClient = new CognitoIdentityProviderClient({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const validatePassword = (password: string): boolean => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  };

  const handleChangePassword = async () => {
    setIsLoading(true);
    showToast('正在更新密碼...', 'loading');

    try {
      // 基本驗證
      if (!oldPassword || !newPassword || !confirmPassword) {
        showToast('請輸入所有必填欄位', 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        showToast('新密碼與確認密碼不符', 'error');
        return;
      }

      if (!validatePassword(newPassword)) {
        showToast('新密碼不符合安全要求，請確認包含大小寫字母、數字和特殊符號', 'error');
        return;
      }

      // 密碼強度檢查
      const strength = calculatePasswordStrength(newPassword);
      if (strength < 3) {
        showToast('密碼強度不足，請增加密碼複雜度', 'error');
        return;
      }

      // 變更密碼
      const changePasswordCommand = new ChangePasswordCommand({
        PreviousPassword: oldPassword,
        ProposedPassword: newPassword,
        AccessToken: user?.accessToken!,
      });

      await cognitoClient.send(changePasswordCommand);
      
      // 成功訊息
      showToast('密碼變更成功！3秒後將自動登出...', 'success', {
        duration: 3000,
        icon: faKey
      });
      
      // 重置表單
      resetPasswordFields();
      
      // 延遲登出
      setTimeout(() => {
        handleLogout();
      }, 3000);

    } catch (error: any) {
      // AWS Cognito 錯誤處理
      switch (error.name) {
        case 'NotAuthorizedException':
          showToast('目前密碼錯誤，請重新確認', 'error');
          break;
        case 'InvalidPasswordException':
          showToast('新密碼格式不符合要求，請確認密碼規則', 'error');
          break;
        case 'LimitExceededException':
          showToast('嘗試次數過多，請稍後再試', 'error');
          break;
        default:
          showToast(error.message || '密碼變更失敗，請稍後再試', 'error');
      }
      
      logger.error('密碼變更失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPasswordModal = () => {
    setIsPasswordModalOpen(true);
  };

  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
    resetPasswordFields();
  };

  const handleCancel = () => {
    // 重置所有密碼相關的狀態
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordMessage(null);
  };

  const resetPasswordFields = useCallback(() => {
    // 只在非提交狀態下重置
    if (!isLoading) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setPasswordMessage(null);
      setIsPasswordModalOpen(false);
    }
  }, [isLoading]);

  // 修改事件監聽
  useEffect(() => {
    const handleResetPasswords = () => {
      // 只在非提交狀態下重置
      if (!isLoading) {
        resetPasswordFields();
      }
    };

    window.addEventListener('resetPasswords', handleResetPasswords);

    return () => {
      window.removeEventListener('resetPasswords', handleResetPasswords);
    };
  }, [resetPasswordFields, isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    switch (name) {
      case 'oldPassword':
        setOldPassword(value);
        break;
      case 'newPassword':
        setNewPassword(value);
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        break;
    }
  };

  // 新增一個函數來檢查是否所有密碼欄位都為空
  const areAllPasswordFieldsEmpty = () => {
    return !oldPassword && !newPassword && !confirmPassword;
  };

  return {
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showOldPassword,
    setShowOldPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    passwordMessage,
    setPasswordMessage,
    isPasswordModalOpen,
    setIsPasswordModalOpen,
    isLoading,
    resetPasswordFields,
    calculatePasswordStrength,
    validatePassword,
    handleChangePassword,
    handleOpenPasswordModal,
    handleClosePasswordModal,
    handleCancel,
    handleChange,
    areAllPasswordFieldsEmpty,
  };
};

export type UseProfilePasswordReturn = ReturnType<typeof useProfilePassword>; 