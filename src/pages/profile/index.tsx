import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Footer from '../../components/common/Footer';
import Navbar from '../../components/common/Navbar';
import { useAuthContext } from '../../context/AuthContext';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { user, logoutUser } = useAuthContext();
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: user ? user.username : '',
    email: user ? user.username : '',
    registrationDate: '[註冊日期]',
    bio: '這裡是用戶的簡單自我介紹或個人簡介。',
    interests: '標籤1, 標籤2, 標籤3',
    socialMedia: '[社交媒體連結]',
    address: '[用戶地址]',
    phone: '[電話號碼]',
    avatar: 'user.png', // 默認值
    notifications: true,
    privacy: 'public',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAvatar = localStorage.getItem('avatarUrl');
      if (storedAvatar) {
        setFormData(prevData => ({ ...prevData, avatar: storedAvatar }));
      }
    }
  }, []);

  useEffect(() => {
    if (user === null) {
      setShowLoginMessage(true);
      const timer = setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
      return () => clearTimeout(timer);
    } else if (user) {
      setFormData(prevData => ({
        ...prevData,
        username: user.username,
        email: user.username,
      }));
      setShowLoginMessage(false);

      const fetchAvatar = async () => {
        const dynamoClient = new DynamoDBClient({
          region: 'ap-northeast-1',
          credentials: {
            accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
          },
        });

        const queryParams = {
          TableName: 'AWS_Blog_UserProfiles',
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': { S: user?.sub || 'default-sub' },
          },
        };
        try {
          const command = new QueryCommand(queryParams);
          const response = await dynamoClient.send(command);
          if (response.Items && response.Items.length > 0) {
            const avatarUrl = response.Items[0].avatarUrl?.S;
            if (avatarUrl) {
              setFormData(prevData => ({ ...prevData, avatar: avatarUrl }));
              localStorage.setItem('avatarUrl', avatarUrl); // 儲存到 localStorage
            } else {
              console.warn('No avatarUrl found in response.');
            }
          } else {
            console.warn('No items found for userId.');
          }
        } catch (error) {
          console.error('Error fetching avatar from DynamoDB:', error);
        }
      };

      fetchAvatar();
    }
  }, [user, router]);

  const handleSaveChanges = async () => {
    if (tempAvatar) {
      setFormData({ ...formData, avatar: tempAvatar });
      localStorage.setItem('avatarUrl', tempAvatar); // 更新 localStorage

      const dynamoClient = new DynamoDBClient({
        region: 'ap-northeast-1',
        credentials: {
          accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
        },
      });

      const updateParams = {
        TableName: 'AWS_Blog_UserProfiles',
        Key: {
          userId: { S: user?.sub || 'default-sub' },
        },
        UpdateExpression: 'SET avatarUrl = :avatarUrl',
        ExpressionAttributeValues: {
          ':avatarUrl': { S: tempAvatar },
        },
      };

      try {
        const updateCommand = new UpdateItemCommand(updateParams);
        await dynamoClient.send(updateCommand);
        console.log('DynamoDB updated successfully');
        window.location.reload(); // 刷新頁面
      } catch (error) {
        console.error('Error updating DynamoDB:', error);
      }
    }
    setIsEditing(false);
    setTempAvatar(null);
    setUploadMessage(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData({ ...formData, [name]: target.checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push('/auth/login');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validImageTypes.includes(file.type)) {
        setUploadMessage('上傳失敗：檔案類型不支援。');
        return;
      }

      console.log('Uploading file:', file.name);

      const s3Client = new S3Client({
        region: 'ap-northeast-1',
        credentials: {
          accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
        },
      });

      const userSub = user?.sub || 'default-sub';

      const params = {
        Bucket: 'aws-blog-avatar',
        Key: `avatars/${userSub}-${file.name}`,
        Body: file,
        ContentType: file.type,
      };

      try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
        const fileUrl = `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
        console.log('File uploaded successfully:', fileUrl);
        setTempAvatar(fileUrl);
        setUploadMessage('上傳成功！');
      } catch (error) {
        console.error('Error uploading file:', error);
        setUploadMessage('���傳失敗：請稍後再試。');
      }
    }
  };

  return (
    <div className={`${user ? "bg-gray-100 text-gray-900" : "bg-gradient-to-r from-blue-100 to-purple-100"} min-h-screen flex flex-col`}>
      <Navbar />
      <div className="container mx-auto flex-grow p-5">
        {showLoginMessage ? (
          <div className="text-center py-10">
            <h2 className="text-2xl font-semibold text-red-600">請先登入!</h2>
            <p className="text-lg text-gray-700">您將被重新導向至登入頁面...</p>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-4 text-gray-800">個人資料</h1>
            <div className="flex items-center mb-6">
              <img
                src={formData.avatar}
                alt="用戶頭像"
                className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg mr-4"
              />
              <div>
                <p className="text-2xl font-semibold text-gray-800">用戶名: {formData.username}</p>
                <p className="text-lg text-gray-700">電子郵件: {formData.email}</p>
                <p className="text-lg text-gray-700">註冊日期: {formData.registrationDate}</p>
                <p className="text-lg text-gray-700">地址: {formData.address}</p>
                <p className="text-lg text-gray-700">電話: {formData.phone}</p>
              </div>
            </div>
            <div className="profile-info bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-xl font-bold text-gray-800">額外資訊</h3>
              <p className="mt-2"><strong>個人簡介:</strong> {formData.bio}</p>
              <p className="mt-2"><strong>興趣:</strong> {formData.interests}</p>
              <p className="mt-2"><strong>社交媒體:</strong> {formData.socialMedia}</p>
            </div>
            <div className="activity-log bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-xl font-bold text-gray-800">過去的觀看紀錄</h3>
              <ul className="list-disc list-inside mt-2">
                <li>觀看紀錄 1 - 描述</li>
                <li>觀看紀錄 2 - 描述</li>
                <li>觀看紀錄 3 - 描述</li>
              </ul>
            </div>
            <div className="profile-actions mt-6 flex justify-end">
              <button onClick={() => setIsEditing(true)} className="mr-4 bg-blue-600 text-white py-2 px-6 rounded-full hover:bg-blue-700 transition duration-200 shadow-md">
                編輯個人資料
              </button>
              <button onClick={handleLogout} className="bg-red-600 text-white py-2 px-6 rounded-full hover:bg-red-700 transition duration-200 shadow-md">
                登出
              </button>
            </div>
            {isEditing && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
                  <h2 className="text-xl font-bold mb-4">編輯個人資料</h2>
                  <div className="mb-4">
                    <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">更改頭像</label>
                    <input
                      type="file"
                      id="avatar"
                      name="avatar"
                      onChange={handleAvatarChange}
                      className="mt-1 p-2 border border-gray-300 rounded w-full"
                    />
                    {uploadMessage && (
                      <p className={`mt-2 text-sm ${uploadMessage.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
                        {uploadMessage}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">個人簡介</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      className="mt-1 p-2 border border-gray-300 rounded w-full"
                      rows={3}
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="interests" className="block text-sm font-medium text-gray-700">興趣</label>
                    <input
                      id="interests"
                      name="interests"
                      value={formData.interests}
                      onChange={handleChange}
                      className="mt-1 p-2 border border-gray-300 rounded w-full"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="socialMedia" className="block text-sm font-medium text-gray-700">社交媒體連結</label>
                    <input
                      id="socialMedia"
                      name="socialMedia"
                      value={formData.socialMedia}
                      onChange={handleChange}
                      className="mt-1 p-2 border border-gray-300 rounded w-full"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="notifications" className="block text-sm font-medium text-gray-700">通知設置</label>
                    <input
                      type="checkbox"
                      id="notifications"
                      name="notifications"
                      checked={formData.notifications}
                      onChange={handleChange}
                      className="mt-1"
                    />
                    <span className="ml-2 text-gray-700">接收通知</span>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="privacy" className="block text-sm font-medium text-gray-700">隱私設置</label>
                    <select
                      id="privacy"
                      name="privacy"
                      value={formData.privacy}
                      onChange={handleChange}
                      className="mt-1 p-2 border border-gray-300 rounded w-full"
                    >
                      <option value="public">公開</option>
                      <option value="private">私人</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => setIsEditing(false)} className="mr-4 bg-gray-300 py-2 px-4 rounded-full">
                      取消
                    </button>
                    <button onClick={handleSaveChanges} className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition duration-200">
                      保存變更
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;
