import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShieldAlt, 
  faUserSlash, 
  faTrash,
  faExclamationTriangle 
} from '@fortawesome/free-solid-svg-icons';
import { useAuthContext } from '@/context/AuthContext';

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

  const accountInfo = {
    email: user?.email || '',
    username: user?.username || '',
    joinDate: user?.registrationDate || '',
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">帳號管理</h2>
        
        {/* 帳號資訊 */}
        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">用戶名稱</label>
              <p className="font-medium">{accountInfo.username}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">電子郵件</label>
              <p className="font-medium">{accountInfo.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-lg font-semibold text-gray-800">註冊日期：</label>
              <span className="text-lg text-gray-900">
                {formatDate(user?.registrationDate)}
              </span>
            </div>
          </div>
        </div>
        {/* 危險操作區 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-red-600">危險區域</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              disabled={isDeleting}
            >
              <FontAwesomeIcon icon={faTrash} />
              <span>{isDeleting ? '刪除中...' : '永久刪除帳號'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 刪除確認對話框 */}
      <Dialog
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-black opacity-30" />

          <Dialog.Panel className="relative bg-white rounded-lg max-w-md mx-auto p-6">
            <Dialog.Title className="text-lg font-bold text-red-600 flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
              確認刪除帳號？
            </Dialog.Title>
            <Dialog.Description className="mt-4">
              此操作無法復原，您的所有資料將被永久刪除。
            </Dialog.Description>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                取消
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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