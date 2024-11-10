import { useState, useEffect } from 'react';
import { User } from '@/types/userType';
import { toast } from 'react-hot-toast';
import { logger } from '@/utils/logger';
import { DynamoDBClient, UpdateItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import logActivity from '@/pages/api/profile/activity-log';

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
    console.log('=== handleSaveProfileChanges 被調用 ===');
    
    if (!localUsername.trim()) {
      toast.error('用戶名稱不能為空', {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }

    if (!user?.sub) {
      toast.error('找不到用戶資訊', {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }

    if (!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID) {
      toast.error('系統配置錯誤', {
        duration: 3000,
        position: 'top-center',
      });
      return;
    }

    setIsLoading(true);

    const toastId = toast.loading('正在更新個人資料...', {
      position: 'top-center',
    });

    try {
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

      await logActivity(user.sub, `變更用戶名稱為 ${localUsername}`);

      toast.success('個人資料已更新成功！', {
        id: toastId,
        duration: 3000,
      });

      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (error: any) {
      toast.error(error.message || '更新失敗，請稍後再試', {
        id: toastId,
        duration: 3000,
      });
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
