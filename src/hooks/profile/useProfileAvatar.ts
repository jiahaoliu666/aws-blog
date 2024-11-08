import { useState } from 'react';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { User } from '@/types/userType';
import { logger } from '@/utils/logger';
import { toast } from 'react-toastify';

interface UseProfileAvatarProps {
  user: User | null;
  updateUser?: (data: Partial<User>) => void;
  setFormData?: (data: any) => void;
}

export type UseProfileAvatarReturn = {
  tempAvatar: string | null;
  uploadMessage: string | null;
  isUploading: boolean;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  resetUploadState: () => void;
  loadAvatarFromStorage: () => void;
  validateAvatarUrl: (url: string) => boolean;
  setTempAvatar: (avatar: string | null) => void;
};

export const useProfileAvatar = ({ user, updateUser, setFormData }: UseProfileAvatarProps): UseProfileAvatarReturn => {
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const s3Client = new S3Client({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const dynamoClient = new DynamoDBClient({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast.error('請上傳 JPG、PNG 或 GIF 格式的圖片');
      return false;
    }

    if (file.size > maxSize) {
      toast.error('圖片大小不能超過 5MB');
      return false;
    }

    return true;
  };

  const updateDynamoDB = async (userId: string, avatarUrl: string) => {
    const updateCommand = new UpdateItemCommand({
      TableName: 'AWS_Blog_UserProfiles',
      Key: {
        userId: { S: userId }
      },
      UpdateExpression: 'SET avatarUrl = :avatarUrl',
      ExpressionAttributeValues: {
        ':avatarUrl': { S: avatarUrl }
      }
    });
    
    try {
      await dynamoClient.send(updateCommand);
    } catch (error) {
      logger.error('更新 DynamoDB 失敗:', error);
      throw error;
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.sub) return;

    try {
      if (!validateFile(file)) return;

      setIsUploading(true);
      setUploadMessage('正在上傳頭像...');

      // 生成臨時預覽
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);

      // 上傳到 S3
      const fileKey = `avatars/${user.sub}/${Date.now()}-${file.name}`;
      const uploadParams = {
        Bucket: 'aws-blog-avatar',
        Key: fileKey,
        Body: file,
        ContentType: file.type,
      };

      const uploadCommand = new PutObjectCommand(uploadParams);
      await s3Client.send(uploadCommand);

      // 更新用戶資料
      const avatarUrl = `https://aws-blog-avatar.s3.amazonaws.com/${fileKey}`;
      
      // 更新 DynamoDB
      await updateDynamoDB(user.sub, avatarUrl);

      // 更新本地存儲
      localStorage.setItem('userAvatar', avatarUrl);
      
      // 更新所有相關狀態
      setTempAvatar(avatarUrl);
      if (updateUser) {
        updateUser({ avatar: avatarUrl });
      }
      if (setFormData) {
        setFormData((prevData: any) => ({ ...prevData, avatar: avatarUrl }));
      }

      // 觸發全局事件
      window.dispatchEvent(new CustomEvent('avatarUpdate', { detail: avatarUrl }));

      setUploadMessage('頭像上傳成功');
      toast.success('頭像已更新');

    } catch (error) {
      logger.error('上傳頭像失敗:', error);
      setUploadMessage('上傳頭像失敗');
      toast.error('上傳頭像失敗，請稍後重試');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadState = () => {
    setTempAvatar(null);
    setUploadMessage(null);
  };

  const loadAvatarFromStorage = () => {
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
      setTempAvatar(savedAvatar);
      window.dispatchEvent(new CustomEvent('avatarUpdate', { detail: savedAvatar }));
    }
  };

  const validateAvatarUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return {
    tempAvatar,
    uploadMessage,
    isUploading,
    handleAvatarChange,
    resetUploadState,
    loadAvatarFromStorage,
    validateAvatarUrl,
    setTempAvatar
  };
}; 