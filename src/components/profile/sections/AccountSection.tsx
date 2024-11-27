import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShieldAlt, 
  faUserSlash, 
  faTrash,
  faExclamationTriangle,
  faUser,
  faEnvelope,
  faFingerprint,
  faCalendar,
  faCheck,
  faEye,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { SectionContainer } from '../common/SectionContainer';
import { Card } from '../common/Card';
import { commonStyles as styles } from '../common/styles';
import { useAuthContext } from '@/context/AuthContext';
import { useToastContext } from '@/context/ToastContext';
import { SectionTitle } from '../common/SectionTitle';
import { useRouter } from 'next/router';

interface AccountSectionProps {
  accountStatus: string;
  isLoading: boolean;
  error: string | null;
  handleStatusChange: (status: 'active' | 'suspended' | 'deactivated') => Promise<void>;
  handleAccountDeactivation: () => Promise<void>;
  handleAccountDeletion: (password: string) => Promise<void>;
  toggleTwoFactor: () => Promise<void>;
  isDeactivating: boolean;
  isDeleting: boolean;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  passwordError: string | null;
}

// 將 DeleteConfirmationDialog 提取為獨立組件
const DeleteConfirmationDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  password: string;
  onPasswordChange: (value: string) => void;
  isDeleting: boolean;
  passwordError: string | null;
}> = React.memo(({
  isOpen,
  onClose,
  onConfirm,
  password,
  onPasswordChange,
  isDeleting,
  passwordError
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // 當對話框關閉時重置 showPassword 狀態
  useEffect(() => {
    if (!isOpen) {
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPasswordChange(e.target.value);
  };

  const handleClose = () => {
    setShowPassword(false);  // 重置密碼顯示狀態
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-bold text-red-600 flex items-center gap-2">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            確認永久刪除帳號？
          </Dialog.Title>
          
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              此操作將永久刪除您的帳號，所有資料將無法恢復。請輸入密碼以確認此操作。
            </p>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              請輸入密碼確認
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handleInputChange}
                className={`
                  w-full px-4 py-2 pr-12 rounded-xl border
                  ${passwordError ? 'border-red-300' : 'border-gray-300'}
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `}
                placeholder="輸入您的密碼"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon 
                  icon={showPassword ? faEyeSlash : faEye} 
                  className="text-sm"
                />
              </button>
            </div>
            {passwordError && (
              <p className="mt-2 text-sm text-red-600">{passwordError}</p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl"
              onClick={handleClose}
            >
              取消
            </button>
            <button
              type="button"
              className={`
                inline-flex items-center justify-center gap-2
                px-4 py-2.5 rounded-xl
                bg-red-600 text-white
                hover:bg-red-700
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              onClick={onConfirm}
              disabled={isDeleting || !password}
            >
              <FontAwesomeIcon icon={faTrash} className="text-sm" />
              {isDeleting ? '刪除中...' : '確認刪除'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
});

const AccountSection: React.FC<AccountSectionProps> = ({
  accountStatus,
  isLoading,
  error,
  handleStatusChange,
  handleAccountDeactivation,
  handleAccountDeletion,
  toggleTwoFactor,
  isDeactivating,
  isDeleting,
  password,
  setPassword,
  passwordError
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const { user } = useAuthContext();
  const { showToast } = useToastContext();
  const router = useRouter();

  const accountInfo = {
    email: user?.email || '',
    username: user?.username || '',
    joinDate: user?.registrationDate || '',
    userId: user?.sub || ''
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) {
      console.warn('註冊日期未定義:', dateString);
      return '未知日期';
    }

    try {
      // 處理 ISO 格式的日期字串
      if (dateString.includes('T')) {
        dateString = dateString.split('T')[0];
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('無效的日期格式:', dateString);
        return '未知日期';
      }
      
      return new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('日期格式化錯誤:', error);
      return '未知日期';
    }
  };

  const accountItems = [
    {
      icon: faUser,
      label: '用戶名稱',
      value: accountInfo.username
    },
    {
      icon: faEnvelope,
      label: '電子郵件',
      value: accountInfo.email,
      badge: (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 
          text-green-700 text-xs font-medium rounded-full border border-green-200
          shadow-sm shadow-green-100/50">
          <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
          已驗證
        </span>
      )
    },
    {
      icon: faFingerprint,
      label: '用戶 ID',
      value: accountInfo.userId,
      mono: true
    },
    {
      icon: faCalendar,
      label: '註冊日期',
      value: formatDate(accountInfo.joinDate)
    }
  ];

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, [setPassword]);

  const handleDeleteClick = useCallback(() => {
    setIsDeleteModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setPassword('');
  }, [setPassword]);

  const handleConfirmDelete = useCallback(async () => {
    try {
      await handleAccountDeletion(password);
      handleCloseModal();
    } catch (error) {
      console.error('刪除帳號失敗:', error);
      showToast('刪除帳號失敗，請稍後重試', 'error');
    }
  }, [handleAccountDeletion, password, showToast, handleCloseModal]);

  return (
    <div className="w-full">
      <div className="mb-8">
        <SectionTitle 
          title="帳號管理"
          description="管理您的帳號資訊與安全設定"
        />
      </div>

      {/* 帳號資訊卡片 */}
      <Card className="mb-6">
        <div className={styles.contentPadding}>
          <div className="grid gap-6">
            {accountItems.map((item, index) => (
              <div 
                key={index}
                className={`flex items-center gap-4 ${
                  index !== accountItems.length - 1 ? 'border-b border-gray-100 pb-6' : ''
                }`}
              >
                <div className={styles.iconWrapper}>
                  <FontAwesomeIcon icon={item.icon} />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-gray-600">{item.label}</label>
                  <div className="flex items-center gap-3">
                    <p className={`font-medium ${item.mono ? 'font-mono' : ''}`}>
                      {item.value}
                    </p>
                    {item.badge && (
                      item.badge
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 危險操作區 */}
      <Card>
        <div className={styles.contentPadding}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 
              flex items-center justify-center">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-600">危險區域</h3>
              <p className="text-sm text-gray-600">這些操作無法復原，請謹慎執行</p>
            </div>
          </div>

          <button
            onClick={handleDeleteClick}
            className={`
              ${styles.button}
              w-full sm:w-auto
              inline-flex items-center justify-center gap-2
              px-4 py-2.5 rounded-xl
              bg-white text-red-600
              border border-red-200
              hover:bg-red-50
            `}
            disabled={isDeleting}
          >
            <FontAwesomeIcon icon={faTrash} className="text-sm" />
            <span>{isDeleting ? '刪除中...' : '永久刪除帳號'}</span>
          </button>
        </div>
      </Card>

      {/* 將刪除確認對話框組件加入到現有的 JSX 中 */}
      <DeleteConfirmationDialog
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        password={password}
        onPasswordChange={setPassword}
        isDeleting={isDeleting}
        passwordError={passwordError}
      />

      {/* 停用確認對話框 */}
      <Dialog
        open={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-black opacity-30" />

          <Dialog.Panel className="relative bg-white rounded-lg max-w-md mx-auto p-6">
            <Dialog.Title className="text-lg font-bold text-yellow-600 flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
              確認停用帳號？
            </Dialog.Title>
            <Dialog.Description className="mt-4">
              停用後您將無法使用此帳號，但可以隨時重新啟用。
            </Dialog.Description>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsDeactivateModalOpen(false)}
              >
                取消
              </button>
              <button
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                onClick={() => {
                  handleAccountDeactivation();
                  setIsDeactivateModalOpen(false);
                }}
              >
                確認停用
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-600 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default React.memo(AccountSection); 