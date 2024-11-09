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

export const useProfileForm = ({ user, updateUser }: UseProfileFormProps) => {
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
    console.log('參數檢查:', {
      localUsername,
      'user?.sub': user?.sub,
      'user?.username': user?.username,
      'process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID': process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID
    });

    if (!user?.sub) {
      console.error('錯誤: 找不到用戶 sub');
      throw new Error('用戶驗證資訊不完整');
    }

    if (!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID) {
      console.error('錯誤: 找不到 USER_POOL_ID');
      throw new Error('系統配置錯誤');
    }

    setIsLoading(true);

    try {
      const updateUserCommand = new AdminUpdateUserAttributesCommand({
        UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
        Username: user.sub,
        UserAttributes: [
          {
            Name: 'preferred_username',
            Value: localUsername,
          },
          {
            Name: 'name',
            Value: localUsername,
          }
        ],
      });

      console.log('發送更新請求到 Cognito...');
      const response = await cognitoClient.send(updateUserCommand);
      console.log('Cognito 回應:', response);

      // 更新本地狀態
      setFormData(prev => ({ ...prev, username: localUsername }));
      updateUser({ username: localUsername });
      setIsEditable(prev => ({ ...prev, username: false }));

      // 記錄活動
      await logActivity(user.sub, `變更用戶名稱為 ${localUsername}`);

      toast.success('個人資料已更新');

      // 延遲重新載入頁面
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (error: any) {
      console.error('更新失敗:', error);
      throw new Error(error.message || '更新失敗，請稍後再試');
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
  };

  const handleCancelChanges = () => {
    setLocalUsername(user?.username || '');
    setIsEditable(prev => ({
      ...prev,
      username: false
    }));
    setIsEditing(false);
  };

  const toggleEditableField = (field: string) => {
    setIsEditable(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
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
    setLocalUsername(user?.username || '');
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
    isLoading,
  };
};

export type UseProfileFormReturn = {
  // 定義型別的內容
}; 