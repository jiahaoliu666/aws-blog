import { useState, useEffect } from 'react';
import { User } from '@/types/userType';
import { logger } from '@/utils/logger';
import { DynamoDBClient, UpdateItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import logActivity from '@/pages/api/profile/activity-log';
import { useToastContext } from '@/context/ToastContext';

interface FormData {
  username: string;
  email: string;
  registrationDate: string;
  avatar: string;
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

export type UseProfileFormReturn = {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  isEditable: {
    username: boolean;
  };
  localUsername: string;
  setLocalUsername: (username: string) => void;
  handleEditClick: (field: string) => void;
  handleCancelChanges: () => void;
  handleSaveProfileChanges: (username: string) => void;
  isLoading: boolean;
  // ... 其他必要的屬性
};

export const useProfileForm = ({ user, updateUser }: UseProfileFormProps): UseProfileFormReturn => {
  const { showToast } = useToastContext();

  const [formData, setFormData] = useState<FormData>({
    username: user?.username || '',
    email: user?.email || '',
    registrationDate: user?.registrationDate || '',
    avatar: user?.avatar || '/default-avatar.png',
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
  const [isEditing, setIsEditing] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const dynamoClient = new DynamoDBClient({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const cognitoClient = new CognitoIdentityProviderClient({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveProfileChanges = async (localUsername: string) => {
    if (!localUsername.trim()) {
      showToast('用戶名稱不能為空', 'error');
      return;
    }

    if (localUsername.length > 10) {
      showToast('用戶名稱不能超過10個字', 'error');
      return;
    }

    setIsLoading(true);
    showToast('正在儲存...', 'loading');

    try {
      if (!user) {
        throw new Error('找不到用戶資料');
      }

      const updateUserCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
        Username: user.sub,
        UserAttributes: [
          {
            Name: 'name',
            Value: localUsername,
          }
        ],
      });

      await cognitoClient.send(updateUserCommand);

      setFormData(prev => ({ ...prev, username: localUsername }));
      updateUser({ username: localUsername });
      setIsEditable(prev => ({ ...prev, username: false }));

      await logActivity(user.sub, `變更用戶名稱為：${localUsername}`);

      showToast('用戶名稱更新成功！', 'success');

      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (error: any) {
      showToast(error.message || '更新失敗，請稍後再試', 'error');
      logger.error('更新個人資料失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (field: string) => {
    setIsEditable(prev => ({
      ...prev,
      [field]: true
    }));
    setIsEditing(true);
    if (field === 'username') {
      setLocalUsername(formData.username);
    }
  };

  const handleCancelChanges = () => {
    setLocalUsername(formData.username);
    setIsEditable(prev => ({
      ...prev,
      username: false
    }));
    setIsEditing(false);
  };

  const resetForm = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      registrationDate: user?.registrationDate || '',
      avatar: user?.avatar || '/default-avatar.png',
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

  const resetUsername = () => {
    setLocalUsername(formData.username);
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
    handleEditClick,
    handleCancelChanges,
    handleSaveProfileChanges,
    isLoading,
    // ... 其他返回值
  };
};
