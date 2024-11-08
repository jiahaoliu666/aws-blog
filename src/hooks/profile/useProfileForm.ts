import { useState, useEffect } from 'react';
import { User } from '@/types/userType';
import { toast } from 'react-toastify';
import { logger } from '@/utils/logger';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
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

  const dynamoClient = new DynamoDBClient({
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

  const handleSaveProfileChanges = async (username: string) => {
    try {
      if (!user?.sub) {
        throw new Error('找不到用戶ID');
      }

      const params = {
        TableName: 'AWS_Blog_Users',
        Key: {
          userId: { S: user.sub }
        },
        UpdateExpression: 'SET username = :username, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':username': { S: username },
          ':updatedAt': { S: new Date().toISOString() }
        }
      };

      const command = new UpdateItemCommand(params);
      await dynamoClient.send(command);

      updateUser({ username });
      setIsEditable(prev => ({ ...prev, username: false }));
      toast.success('個人資料已更新');

      await logActivity(user.sub, '更新個人資料');

    } catch (error) {
      logger.error('更新個人資料失敗:', error);
      toast.error('更新個人資料失敗');
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
    resetUsername
  };
};

export type UseProfileFormReturn = {
  // 定義型別的內容
}; 