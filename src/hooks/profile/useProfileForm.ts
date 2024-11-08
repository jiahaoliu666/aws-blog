import { useState, useEffect } from 'react';
import { User } from '@/types/userType';
import { toast } from 'react-toastify';
import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import logActivity from '@/pages/api/profile/activity-log';

interface FormData {
  username: string;
  email: string;
  registrationDate: string;
  avatar: string;
  password: string;
  confirmPassword: string;
  feedbackTitle: string;
  feedbackContent: string;
  feedbackImage?: File;
  notifications: {
    email: boolean;
    line: boolean;
  };
  showEmailSettings: boolean;
  showLineSettings: boolean;
}

interface EditableFields {
  username: boolean;
  password: boolean;
  [key: string]: boolean;
}

interface UseProfileFormProps {
  user: User | null;
  updateUser: (user: Partial<User>) => void;
}

export const useProfileForm = ({ user, updateUser }: UseProfileFormProps) => {
  // State
  const [formData, setFormData] = useState<FormData>({
    username: user?.username || '',
    email: user?.email || '',
    registrationDate: user?.registrationDate || '',
    avatar: user?.avatar || '/default-avatar.png',
    password: '',
    confirmPassword: '',
    feedbackTitle: '',
    feedbackContent: '',
    notifications: {
      email: false,
      line: false
    },
    showEmailSettings: false,
    showLineSettings: false,
  });

  const [isEditable, setIsEditable] = useState<EditableFields>({
    username: false,
    password: false
  });

  const [localUsername, setLocalUsername] = useState(user?.username || '');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const cognitoClient = new CognitoIdentityProviderClient({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });

  // 表單變更處理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // 儲存個人資料變更
  const handleSaveProfileChanges = async (username: string) => {
    let hasChanges = false;
    let changesSuccessful = true;

    if (!username.trim()) {
      setUploadMessage('用戶名稱不能為空');
      return;
    }

    if (username !== user?.username) {
      hasChanges = true;
      try {
        const updateUserCommand = new AdminUpdateUserAttributesCommand({
          UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
          Username: user?.sub!,
          UserAttributes: [
            {
              Name: 'name',
              Value: username,
            },
          ],
        });
        
        await cognitoClient.send(updateUserCommand);
        setUploadMessage('用戶名更新成功，頁面更新中...');
        updateUser({ username });
        setFormData(prevData => ({ ...prevData, username }));

        await logActivity(user?.sub || 'default-sub', `變更用戶名為 ${username}`);
      } catch (error) {
        setUploadMessage('更新用戶名失敗，請稍後再試');
        changesSuccessful = false;
      }
    }

    if (!hasChanges) {
      setUploadMessage('無任何變更項目');
    }

    if (hasChanges && changesSuccessful) {
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  };

  // 取消編輯
  const handleCancelChanges = () => {
    setIsEditing(false);
    setLocalUsername(user?.username || '');
    setIsEditable(prev => ({ ...prev, username: false }));
    setFormData(prevData => ({ ...prevData, username: user?.username || '' }));
  };

  // 開始編輯
  const handleEditClick = () => {
    setLocalUsername(user?.username || '');
    setIsEditable({
      username: false,
      password: false,
    });
    setUploadMessage(null);
    setIsEditing(true);
  };

  // 切換可編輯欄位
  const toggleEditableField = (field: keyof EditableFields) => {
    setIsEditable(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // 重置表單
  const resetForm = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      registrationDate: user?.registrationDate || '',
      avatar: user?.avatar || '/default-avatar.png',
      password: '',
      confirmPassword: '',
      feedbackTitle: '',
      feedbackContent: '',
      notifications: {
        email: false,
        line: false
      },
      showEmailSettings: false,
      showLineSettings: false,
    });
    setIsEditing(false);
    setUploadMessage(null);
  };

  // 重置用戶名
  const resetUsername = () => {
    setLocalUsername(user?.username || '');
  };

  // 處理頭像變更
  const handleAvatarChange = (newAvatar: File) => {
    setFormData(prevData => ({
      ...prevData,
      avatar: URL.createObjectURL(newAvatar)
    }));
  };

  useEffect(() => {
    if (user) {
      setLocalUsername(user.username);
      setFormData(prev => ({
        ...prev,
        username: user.username,
        email: user.email || '',
        registrationDate: user.registrationDate || '',
        avatar: user.avatar || '/default-avatar.png'
      }));
    }
  }, [user]);

  return {
    formData,
    setFormData,
    isEditable,
    localUsername,
    setLocalUsername,
    uploadMessage,
    isEditing,
    handleChange,
    handleSaveProfileChanges,
    handleCancelChanges,
    handleEditClick,
    toggleEditableField,
    resetForm,
    resetUsername,
    handleAvatarChange
  };
};

export type UseProfileFormReturn = {
  // 定義型別的內容
}; 