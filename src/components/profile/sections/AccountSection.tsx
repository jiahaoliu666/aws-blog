import React, { useState } from 'react';
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
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { SectionContainer } from '../common/SectionContainer';
import { Card } from '../common/Card';
import { commonStyles as styles } from '../common/styles';
import { useAuthContext } from '@/context/AuthContext';
import { useToastContext } from '@/context/ToastContext';
import { SectionTitle } from '../common/SectionTitle';

interface AccountSectionProps {
  accountStatus: string;
  isLoading: boolean;
  error: string | null;
  handleStatusChange: (status: 'active' | 'suspended' | 'deactivated') => Promise<void>;
  handleAccountDeactivation: () => Promise<void>;
  handleAccountDeletion: () => Promise<void>;
  toggleTwoFactor: () => Promise<void>;
  isDeactivating: boolean;
  isDeleting: boolean;
}

const AccountSection: React.FC<AccountSectionProps> = ({
  accountStatus,
  isLoading,
  error,
  handleStatusChange,
  handleAccountDeactivation,
  handleAccountDeletion,
  toggleTwoFactor,
  isDeactivating,
  isDeleting
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const { user } = useAuthContext();
  const { showToast } = useToastContext();

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
            onClick={() => setIsDeleteModalOpen(true)}
            className={`
              ${styles.button}
              border-2 border-red-200 text-red-600
              hover:bg-red-50 hover:border-red-300
              focus:ring-4 focus:ring-red-100
              disabled:opacity-50 disabled:cursor-not-allowed
              w-full sm:w-auto
            `}
            disabled={isDeleting}
          >
            <FontAwesomeIcon icon={faTrash} />
            <span>{isDeleting ? '刪除中...' : '永久刪除帳號'}</span>
          </button>
        </div>
      </Card>

      {/* 刪除確認對話框 */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 
                flex items-center justify-center">
                <FontAwesomeIcon icon={faExclamationTriangle} size="lg" />
              </div>
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                確認刪除帳號？
              </Dialog.Title>
            </div>

            <Dialog.Description className="text-gray-600 mb-6">
              此操作將永久刪除您的帳號和所有相關資料，且無法復原。
            </Dialog.Description>

            <div className="flex justify-end gap-3">
              <button
                className={`${styles.button} ${styles.secondaryButton}`}
                onClick={() => setIsDeleteModalOpen(false)}
              >
                取消
              </button>
              <button
                className={`${styles.button} ${styles.dangerButton}`}
                onClick={() => {
                  handleAccountDeletion();
                  setIsDeleteModalOpen(false);
                }}
              >
                確認刪除
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

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

export default AccountSection; 