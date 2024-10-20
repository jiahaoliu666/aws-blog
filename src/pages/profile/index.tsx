import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Footer from '../../components/common/Footer';
import Navbar from '../../components/common/Navbar';
import { useAuthContext } from '../../context/AuthContext';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { CognitoIdentityProviderClient, GetUserCommand, AdminUpdateUserAttributesCommand, ChangePasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { PasswordField, SwitchField } from '@aws-amplify/ui-react'; // 確保導入 PasswordField 和 SwitchField
import '@aws-amplify/ui-react/styles.css';  
import { Loader } from '@aws-amplify/ui-react';



const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { user, logoutUser, updateUser } = useAuthContext();
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: user ? user.username : '',
    email: user ? user.email : '', // 使用從 AuthContext 獲取的 email
    registrationDate: '[註期]',
    avatar: 'user.png', // 默認值
    notifications: true,
    password: '', // 新增 password 屬性
  });
  const [oldPassword, setOldPassword] = useState(''); // 新增狀態來存儲舊密碼
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null); // 新增狀態來存儲密碼更新消息
  const [isEditable, setIsEditable] = useState({
    username: false,
    password: false,
  });
  const [isLoading, setIsLoading] = useState(false); // 新增狀態來追蹤是否正在重整頁面
  const cognitoClient = new CognitoIdentityProviderClient({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });
  const [tempUsername, setTempUsername] = useState(user ? user.username : ''); // 新增一個狀態來存儲臨時用戶名
  const [recentArticles, setRecentArticles] = useState<string[]>([]); // 新增狀態來存儲最近的觀看紀錄

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
        email: user.email,
      }));
      setShowLoginMessage(false);

      const fetchUserDetails = async () => {
        try {
          const userCommand = new GetUserCommand({ AccessToken: user.accessToken });
          const userResponse = await cognitoClient.send(userCommand);

          const registrationDateAttribute = userResponse.UserAttributes?.find(attr => attr.Name === 'custom:registrationDate');
          const registrationDate = registrationDateAttribute ? registrationDateAttribute.Value : '[註冊日期]';

          setFormData(prevData => ({
            ...prevData,
            registrationDate: registrationDate || '[註冊日期]',
          }));
        } catch (error) {
          const err = error as Error; // 將 error 類型斷言為 Error
          if (err.name === 'NotAuthorizedException' && err.message.includes('Access Token has expired')) {
            // Handle token refresh logic here
            try {
              const newAccessToken = await refreshAccessToken(user.refreshToken);
              user.accessToken = newAccessToken; // Update the user's access token
              fetchUserDetails(); // Retry fetching user details
            } catch (refreshError) {
              console.error('Error refreshing access token:', refreshError);
              router.push('/auth/login'); // Redirect to login if refresh fails
            }
          } else {
            console.error('Error fetching user details:', error);
          }

        }
      };

      fetchUserDetails();
    }
  }, [user, router]);

  useEffect(() => {
    const fetchRecentArticles = async () => {
        if (user) {
            const dynamoClient = new DynamoDBClient({
                region: 'ap-northeast-1',
                credentials: {
                    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
                    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
                },
            });

            const params = {
                TableName: 'AWS_Blog_UserRecentArticles',
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': { S: user.sub },
                },
                ScanIndexForward: false,
            };

            try {
                const command = new QueryCommand(params);
                const response = await dynamoClient.send(command);
                const articleIds = response.Items?.map(item => item.articleId.S).filter((id): id is string => id !== undefined) || [];

                // Fetch translated_title for each articleId
                const titles = await Promise.all(articleIds.map(async (articleId) => {
                    const newsParams = {
                        TableName: 'AWS_Blog_News',
                        KeyConditionExpression: 'article_id = :articleId', // 使用正確的鍵條件
                        ExpressionAttributeValues: {
                            ':articleId': { S: articleId },
                        },
                    };
                    const newsCommand = new QueryCommand(newsParams);
                    const newsResponse = await dynamoClient.send(newsCommand);
                    const translatedTitle = newsResponse.Items?.[0]?.translated_title?.S || '標題不可用';
                    return translatedTitle;
                }));

                setRecentArticles(titles);
            } catch (error) {
                console.error('Error fetching recent articles:', error);
            }
        }
    };

    fetchRecentArticles();
  }, [user]);

  // Function to refresh access token
  const refreshAccessToken = async (refreshToken: string): Promise<string> => {
    // 實現刷新訪問令牌的邏輯
    // 確保返回新的訪問令牌
    const newAccessToken = 'newAccessToken'; // 假設這是從某個 API 獲取的
    return newAccessToken;
  };

  const handleSaveChanges = async () => {
    let passwordChanged = false; // 用於追蹤密碼是否嘗試更改
    let hasError = false; // 用於追蹤是否有錯誤
    let hasChanges = false; // 用於追蹤是否有任何變更
    let changesSuccessful = true; // 用於追蹤變更是否成

    // 檢查用戶名是否為空
    if (!formData.username.trim()) {
      setPasswordMessage('用戶名不能為空。');
      hasError = true;
    }

    // 檢查密碼欄位
    if (formData.password && !oldPassword) {
      setPasswordMessage('請入舊密碼以更改密碼。');
      hasError = true;
    }

    // 新增檢查：只填入舊密碼而未輸入新碼
    if (oldPassword && !formData.password) {
      setPasswordMessage('請輸入新密碼以更改密碼。');
      hasError = true;
    }

    if (hasError) {
      return; // 如果有錯誤，則停止執行
    }

    // 檢查頭像是否有變更
    if (tempAvatar) {
      hasChanges = true;
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
        setPasswordMessage('頭像已成功更新！');
      } catch (error) {
        console.error('Error updating DynamoDB:', error);
        setPasswordMessage('更新頭像失敗，請稍後再試。');
        changesSuccessful = false; // 如果失敗，設置為 false
      }
    }

    // 檢查用戶名是否有變更
    if (tempUsername !== user?.username) { // 使用臨時用戶名進行比較
      hasChanges = true;
      try {
        console.log('UserPoolId:', process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID);
        console.log('Username:', user?.username);

        const updateUserCommand = new AdminUpdateUserAttributesCommand({
          UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
          Username: user?.sub!, // 使用 sub 作為 Username
          UserAttributes: [
            {
              Name: 'name',
              Value: tempUsername,
            },
          ],
        });
        await cognitoClient.send(updateUserCommand);
        console.log('用戶名更新成功');
        setPasswordMessage('用戶名已成功更新！');
        updateUser({ username: tempUsername }); // 更新 AuthContext 中的用戶名
      } catch (error) {
        console.error('更新用戶名時出錯:', error);
        const err = error as Error; // 將 error 類型斷言為 Error
        if (err.name === 'UserNotFoundException') {
          console.error('用戶不存在，請檢查用戶名和用戶池 ID。');
        }
        setPasswordMessage('更新用戶名失敗，請稍再試。');
        changesSuccessful = false;
      }
    }

    // 檢密碼是否變更
    if (formData.password) {
      hasChanges = true;
      passwordChanged = true; // 標記嘗試更改密碼
      try {
        const changePasswordCommand = new ChangePasswordCommand({
          PreviousPassword: oldPassword,
          ProposedPassword: formData.password,
          AccessToken: user?.accessToken!,
        });
        await cognitoClient.send(changePasswordCommand);
        console.log('密碼更新成功');
        setPasswordMessage('密碼變更成功，請重新登入。');
        updateUser({ accessToken: user?.accessToken }); // 更新 AuthContext 中的 accessToken

        // 確保在密碼變更成功後登出
        setTimeout(() => {
          handleLogout();
        }, 2000); // 延遲兩秒鐘後登出
      } catch (error) {
        console.error('更新密碼時出錯:', error as Error);
        if ((error as Error).name === 'LimitExceededException') {
          setPasswordMessage('嘗試次數過多，請稍後再試。');
        } else {
          setPasswordMessage('更新密碼失敗，請確認舊密碼是否正確並重試。');
        }
        changesSuccessful = false; // 如果失敗，設置為 false
      }
    }

    if (!hasChanges) {
      setPasswordMessage('無任何變更項目');
    }

    setTempAvatar(null);
    setUploadMessage(null);

    // 只有在有變更且所有變更都成功時才刷新頁面
    if (hasChanges && changesSuccessful) {
      setIsLoading(true); // 設置為正在重整頁面
      setTimeout(() => {
        window.location.reload();
      }, 1000); // 延遲一秒鐘
    }
  };

  const handleCancelChanges = () => {
    setIsEditing(false);
    setPasswordMessage(null); // 清除消息狀態
    setOldPassword(''); // 清空舊密碼
    setFormData(prevData => ({ ...prevData, password: '' })); // 清空新密碼
    setIsEditable(prev => ({ ...prev, password: false })); // 重置修改密碼的切換按鈕
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

      const validImageTypes = ['image/jpeg', 'image/png'];
      if (!validImageTypes.includes(file.type)) {
        setUploadMessage('上傳失敗：檔案類型不支援，確認檔案類型為 jpeg 或 png');
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
        setUploadMessage('上傳失敗：請稍後再試。');
      }
    }
  };

  const handleEditClick = () => {
    setTempUsername(user ? user.username : ''); // 初始化臨時用戶名
    setOldPassword(''); // 清空舊密碼
    setFormData(prevData => ({ ...prevData, password: '' })); // 清空新密碼
    setIsEditable({
      username: false,
      password: false,
    });
    setUploadMessage(null); // 清除頭像更改消��
    setIsEditing(true);
  };

  useEffect(() => {
    // 假設這裡是您希望在頁面刷新時設 isLoading 的地方
    setIsLoading(true);
    // 模擬一個加載過程
    setTimeout(() => {
      setIsLoading(false);
    }, 1000); // 這裡時間可以根據實際情況調整
  }, []);

  return (
    <div className="bg-gray-100 text-gray-900 min-h-screen flex flex-col">
      <Navbar />
      {!user && (
        <div className="flex-grow flex flex-col justify-center items-center bg-gray-100" style={{ marginTop: '40px' }}> {/* 調整 marginTop 以避免重疊 */}
          <Loader className="mb-4" size="large"/> {/* 保留 Loader 組件 */}
          <h2 className="text-2xl font-semibold text-red-600">請登入!</h2>
          <p className="text-lg text-gray-700">您將被重新導向至登入頁面...</p>
        </div>
      )}
      {user && (
        <div className="container mx-auto flex-grow p-5">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">個人資訊</h1>
          <div className="flex items-center mb-6">
            <img
              src={formData.avatar}
              alt="用戶頭像"
              className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg mr-4"
            />
            <div>
              <p className="text-xl text-gray-700 mb-2">用戶名：{formData.username}</p>
              <p className="text-xl text-gray-700 mb-2">電子郵件：{formData.email}</p>
              <p className="text-xl text-gray-700">註冊日期：{formData.registrationDate}</p>
            </div>
          </div>
          <div className="activity-log bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-xl font-bold text-gray-800">過去的觀看紀錄</h3>
            <ul className="list-disc list-inside mt-2">
              {recentArticles.map((title, index) => (
                <li key={index}>{title}</li> // 顯示 translated_title
              ))}
            </ul>
          </div>
          <div className="profile-actions mt-6 flex justify-end">
            <button onClick={handleEditClick} className="mr-4 bg-blue-600 text-white py-2 px-6 rounded-full hover:bg-blue-700 transition duration-200 shadow-md">
              編輯
            </button>
            <button onClick={handleLogout} className="bg-red-600 text-white py-2 px-6 rounded-full hover:bg-red-700 transition duration-200 shadow-md">
              登出
            </button>
          </div>
          {isEditing && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-8 rounded-lg shadow-lg w-1/3">
                <h2 className="text-2xl font-bold mb-6 text-center">編輯個人資料</h2>
                <hr className="mb-6 mt-6" />
                <div className="space-y-4">
                  <div>
                    <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">更改頭像</label>  
                    <input
                      type="file"
                      id="avatar"
                      name="avatar"
                      onChange={handleAvatarChange}
                      className="mt-2 p-2 border border-gray-300 rounded w-full"
                    />
                    {uploadMessage && (
                      <p className={`mt-2 text-sm ${uploadMessage.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
                        {uploadMessage}
                      </p>
                    )}
                  </div>
                  <div className="pt-3"> 
                    <hr className="mb-6" />
                    <div className="flex items-center mt-2">
                      <SwitchField
                        label="修改用戶名"
                        isChecked={isEditable.username}
                        onChange={() => setIsEditable(prev => ({ ...prev, username: !prev.username }))}
                        className="mr-2"
                      />
                      <SwitchField
                        label="修改密碼"
                        isChecked={isEditable.password}
                        onChange={() => setIsEditable(prev => ({ ...prev, password: !prev.password }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">修改用戶名</label>
                    <input
                      id="name"
                      name="username"
                      value={tempUsername} // 使用臨時用戶名
                      onChange={(e) => setTempUsername(e.target.value)} // 更新臨時用戶名
                      className="mt-2 p-2 border border-gray-300 rounded w-full"
                      disabled={!isEditable.username}
                    />
                  </div>
                  <div className="mt-4">
                    <PasswordField
                      id="oldPassword"
                      label="舊密碼"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="輸入舊密碼"
                      required
                      className="border border-gray-300 p-2 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      disabled={!isEditable.password}
                    />
                    <p className="text-xs text-gray-500 mt-1">請輸入舊密碼。</p>
                  </div>
                  <div>
                    <PasswordField
                      label="修改密碼"
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="輸入新密碼"
                      required
                      className="border border-gray-300 p-2 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full mb-2" // 添加 mb-2
                      disabled={!isEditable.password}
                    />
                    <p className="text-xs text-gray-500 mt-1">請輸入新密碼。</p>
                  </div>
                </div>

                {passwordMessage && (
                  <div className={`mt-4 mb-6 p-4 rounded-lg shadow-md ${passwordMessage.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {passwordMessage}
                  </div>
                )}

                <div className="flex justify-end space-x-4 mt-6">
                  <button onClick={handleCancelChanges} className="bg-gray-300 py-2 px-4 rounded-full hover:bg-gray-400 transition duration-200">
                    取消變更
                  </button>
                  <button onClick={handleSaveChanges} className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition duration-200">
                    保存變更
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <Footer />
    </div>
  );
};

export default ProfilePage;
