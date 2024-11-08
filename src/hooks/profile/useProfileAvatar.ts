import { useState } from 'react';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { User } from '@/types/userType';
import logActivity from '../../pages/api/profile/activity-log';
import { toast } from 'react-toastify';

interface UseProfileAvatarProps {
  user: User | null;
  setFormData: (data: any) => void;
}

// 定義 UseProfileAvatarReturn 型別
export type UseProfileAvatarReturn = {
  tempAvatar: string | null;
  uploadMessage: string | null;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  resetUploadState: () => void;
  loadAvatarFromStorage: () => void;
  validateAvatarUrl: (url: string) => boolean;
  setTempAvatar: React.Dispatch<React.SetStateAction<string | null>>;
};

export const useProfileAvatar = ({ user, setFormData }: UseProfileAvatarProps): UseProfileAvatarReturn => {
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // 驗證檔案類型
      const validImageTypes = ['image/jpeg', 'image/png'];
      if (!validImageTypes.includes(file.type)) {
        setUploadMessage('上傳失敗：檔案類型不支援，請確認檔案類型是否為 jpeg 或 png。');
        toast.error('不支援的檔案類型');
        return;
      }

      const userSub = user?.sub || 'default-sub';

      // 準備 S3 上傳參數
      const params = {
        Bucket: 'aws-blog-avatar',
        Key: `avatars/${userSub}-${file.name}`,
        Body: file,
        ContentType: file.type,
      };

      try {
        // 上傳到 S3
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        const fileUrl = `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
        
        // 更新 DynamoDB
        const updateParams = {
          TableName: 'AWS_Blog_UserProfiles',
          Key: {
            userId: { S: userSub },
          },
          UpdateExpression: 'SET avatarUrl = :avatarUrl',
          ExpressionAttributeValues: {
            ':avatarUrl': { S: fileUrl },
          },
        };

        const updateCommand = new UpdateItemCommand(updateParams);
        await dynamoClient.send(updateCommand);

        // 更新本地狀態
        setTempAvatar(fileUrl);
        setFormData((prevData: any) => ({ ...prevData, avatar: fileUrl }));
        localStorage.setItem('avatarUrl', fileUrl);
        setUploadMessage('頭像更換成功，頁面刷新中...');
        toast.success('頭像更新成功');

        // 記錄活動
        await logActivity(userSub, '更換頭像');

        // 延遲重新載入頁面
        setTimeout(() => {
          window.location.reload();
        }, 3000);

      } catch (error) {
        console.error('Error uploading file or updating profile:', error);
        setUploadMessage('上傳失敗：請稍後再試。');
        toast.error('頭像上傳失敗');
      }
    }
  };

  const resetUploadState = () => {
    setUploadMessage(null);
    setTempAvatar(null);
  };

  // 從 localStorage 讀取頭像
  const loadAvatarFromStorage = () => {
    if (typeof window !== 'undefined') {
      const storedAvatar = localStorage.getItem('avatarUrl');
      if (storedAvatar) {
        setFormData((prevData: any) => ({ ...prevData, avatar: storedAvatar }));
      }
    }
  };

  // 驗證頭像 URL
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
    handleAvatarChange,
    resetUploadState,
    loadAvatarFromStorage,
    validateAvatarUrl,
    setTempAvatar
  };
}; 