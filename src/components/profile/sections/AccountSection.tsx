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
import { logger } from '@/utils/logger';

interface AccountSectionProps {
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  isDeleting: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  handleAccountDeletion: () => Promise<void>;
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
  confirmDeleteValue: string;
  onConfirmDeleteValueChange: (value: string) => void;
}> = React.memo(({
  isOpen,
  onClose,
  onConfirm,
  password,
  onPasswordChange,
  isDeleting,
  passwordError,
  confirmDeleteValue,
  onConfirmDeleteValueChange
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { showToast } = useToastContext();
  const { user } = useAuthContext();

  // 當對話框關閉時重置密碼顯示狀態
  useEffect(() => {
    if (!isOpen) {
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleConfirmClick = async () => {
    if (!password.trim()) {
      showToast('請輸入密碼以確認刪除', 'error');
      return;
    }
    
    if (!user?.userId || !user?.sub) {
      showToast('無法取得用戶資訊，請重新登入', 'error');
      return;
    }
    
    try {
      await onConfirm();
    } catch (error) {
      let errorMessage = '刪除帳號失敗';
      if (error instanceof Error) {
        if (error.message.includes('Cognito 用戶不存在')) {
          errorMessage = 'Cognito 身份驗證用戶不存在';
        } else if (error.message.includes('DynamoDB 用戶資料不存在')) {
          errorMessage = '用戶資料不存在於資料庫';
        } else if (error.message.includes('密碼錯誤')) {
          errorMessage = '密碼驗證失敗';
        }
      }
      showToast(errorMessage, 'error');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <Dialog.Title as="h3" className="text-lg font-bold text-red-600 flex items-center gap-2">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            確認永久刪除帳號？
          </Dialog.Title>
          
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              此操作將永久刪除您的帳號，所有資料將無法恢復。請輸入密碼以確認此操作。
            </p>
          </div>

          <div className="mt-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用戶 ID
              </label>
              <input
                type="text"
                value={user?.sub || ''}
                readOnly
                className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-gray-50 text-gray-500 font-mono"
              />
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              請輸入密碼以確認刪除
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                className={`
                  w-full px-4 py-2 pr-10 rounded-xl 
                  border ${passwordError ? 'border-red-500' : 'border-gray-300'}
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                `}
                placeholder="輸入密碼以確認"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
              {passwordError && (
                <p className="mt-2 text-sm text-red-600">
                  {passwordError}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              請輸入 "確認刪除" 以繼續
            </label>
            <input
              type="text"
              value={confirmDeleteValue}
              onChange={(e) => onConfirmDeleteValueChange(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-300"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl"
              onClick={onClose}
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
              onClick={handleConfirmClick}
              disabled={isDeleting || !password}
            >
              <FontAwesomeIcon icon={faTrash} className="text-sm" />
              {isDeleting ? '刪除中...' : '確認刪除'}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
});

const AccountSection: React.FC<AccountSectionProps> = ({
  password,
  setPassword,
  isDeleting,
  error,
  setError,
  handleAccountDeletion
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmDeleteValue, setConfirmDeleteValue] = useState('');
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
    setError(null);
    setConfirmDeleteValue('');
  }, [setPassword, setError]);

  const handleConfirmDelete = useCallback(async () => {
    if (!password.trim()) {
      showToast('請輸入密碼以確認刪除', 'error');
      return;
    }

    if (confirmDeleteValue !== '確認刪除') {
      showToast('請輸入正確的確認刪除值', 'error');
      return;
    }

    try {
      await handleAccountDeletion();
      setIsDeleteModalOpen(false);
      setPassword('');
      setError(null);
      setConfirmDeleteValue('');
    } catch (error) {
      setError(error instanceof Error ? error.message : '刪除失敗');
    }
  }, [password, confirmDeleteValue, handleAccountDeletion, showToast, setPassword, setError]);

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

      {/* 刪除確認對話框 */}
      <DeleteConfirmationDialog
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        password={password}
        onPasswordChange={setPassword}
        isDeleting={isDeleting}
        passwordError={error}
        confirmDeleteValue={confirmDeleteValue}
        onConfirmDeleteValueChange={setConfirmDeleteValue}
      />
    </div>
  );
};

export default React.memo(AccountSection); 