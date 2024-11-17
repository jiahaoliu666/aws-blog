import { useState } from 'react';
import { CognitoIdentityProviderClient, ChangePasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { User } from '@/types/userType';
import { toast } from 'react-toastify';
import { logger } from '@/utils/logger';

interface UseProfilePasswordProps {
  user: User | null;
  handleLogout: () => void;
}

export const useProfilePassword = ({ user, handleLogout }: UseProfilePasswordProps) => {
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
    try {
      // 基本驗證
      if (!oldPassword || !newPassword || !confirmPassword) {
        throw new Error('請輸入舊密碼、新密碼和確認密碼');
      }

      if (!validatePassword(newPassword)) {
        throw new Error('新密碼不符合安全要求');
      }

      // 密碼強度檢查
      const strength = calculatePasswordStrength(newPassword);
      if (strength < 3) {
        throw new Error('密碼強度不足，需包含大小寫字母、數字和特殊符號');
      }

      // 變更密碼
      const changePasswordCommand = new ChangePasswordCommand({
        PreviousPassword: oldPassword,
        ProposedPassword: newPassword,
        AccessToken: user?.accessToken!,
      });

      await cognitoClient.send(changePasswordCommand);
      
      setPasswordMessage('密碼變更成功，請重新登入');
      toast.success('密碼變更成功');
      
      // 延遲登出
      setTimeout(handleLogout, 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '密碼變更失敗';
      setPasswordMessage(errorMessage);
      toast.error(errorMessage);
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

  const resetPasswordFields = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordMessage(null);
  };

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
    isPasswordModalOpen,
    isLoading,
    handleChangePassword,
    handleOpenPasswordModal,
    handleClosePasswordModal,
    resetPasswordFields,
    calculatePasswordStrength,
    validatePassword,
    handleCancel,
    handleChange,
  };
};

export type UseProfilePasswordReturn = ReturnType<typeof useProfilePassword>; 