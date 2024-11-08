import { useState } from 'react';
import { CognitoIdentityProviderClient, ChangePasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { User } from '@/types/userType';
import logActivity from '@/pages/api/profile/activity-log';
import { toast } from 'react-toastify';


interface UseProfilePasswordProps {
  user: User | null;
  handleLogout: () => Promise<void>;
}

export type UseProfilePasswordReturn = {
  oldPassword: string;
  showOldPassword: boolean;
  showNewPassword: boolean;
  passwordMessage: string | null;
  isPasswordModalOpen: boolean;
  isLoading: boolean;
  setOldPassword: React.Dispatch<React.SetStateAction<string>>;
  setShowOldPassword: React.Dispatch<React.SetStateAction<boolean>>;
  setShowNewPassword: React.Dispatch<React.SetStateAction<boolean>>;
  handleChangePassword: (newPassword: string, confirmPassword: string) => Promise<void>;
  handleOpenPasswordModal: () => void;
  handleClosePasswordModal: () => void;
  resetPasswordFields: () => void;
  calculatePasswordStrength: (password: string) => number;
  newPassword: string;
  setNewPassword: (newPassword: string) => void;
};

export const useProfilePassword = ({ user, handleLogout }: UseProfilePasswordProps): UseProfilePasswordReturn => {
  const [oldPassword, setOldPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState<string>('');

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

  const handleChangePassword = async (newPassword: string, confirmPassword: string) => {
    setIsLoading(true);
    try {
      // 基本驗證
      if (!oldPassword || !newPassword) {
        throw new Error('請輸入舊密碼和新密碼');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('新密碼和確認密碼不一致');
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
      
      // 成功處理
      setPasswordMessage('密碼變更成功，請重新登入');
      toast.success('密碼變更成功');
      await logActivity(user?.sub || 'default-sub', '變更密碼');
      
      // 延遲登出
      setTimeout(handleLogout, 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '密碼變更失敗';
      setPasswordMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPasswordModal = () => {
    setIsPasswordModalOpen(true);
  };

  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setOldPassword('');
    setPasswordMessage(null);
  };

  const resetPasswordFields = () => {
    setOldPassword('');
    setShowOldPassword(false);
    setShowNewPassword(false);
    setPasswordMessage(null);
  };

  return {
    oldPassword,
    showOldPassword,
    showNewPassword,
    passwordMessage,
    isPasswordModalOpen,
    isLoading,
    setOldPassword,
    setShowOldPassword,
    setShowNewPassword,
    handleChangePassword,
    handleOpenPasswordModal,
    handleClosePasswordModal,
    resetPasswordFields,
    calculatePasswordStrength,
    newPassword,
    setNewPassword,
  };
}; 