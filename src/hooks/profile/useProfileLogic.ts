import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../context/AuthContext';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, QueryCommand, UpdateItemCommand, DeleteItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { CognitoIdentityProviderClient, GetUserCommand, AdminUpdateUserAttributesCommand, ChangePasswordCommand } from '@aws-sdk/client-cognito-identity-provider';

interface EditableFields {
  username: boolean;
  password: boolean;
}

export const useProfileLogic = () => {
  const router = useRouter();
  const { user, logoutUser, updateUser } = useAuthContext();
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: user ? user.username : '',
    email: user ? user.email : '',
    registrationDate: '[註冊日期]',
    avatar: 'user.png',
    notifications: true,
    password: '', // 確保這裡有初始化 password
  });
  const [oldPassword, setOldPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [isEditable, setIsEditable] = useState<EditableFields>({
    username: false,
    password: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const cognitoClient = new CognitoIdentityProviderClient({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });
  const [tempUsername, setTempUsername] = useState(user ? user.username : '');
  const [recentArticles, setRecentArticles] = useState<{ translatedTitle: string; link: string; timestamp: string; sourcePage: string }[]>([]);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [activityLog, setActivityLog] = useState<{ date: string; action: string; details: string }[]>([]);

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
          const err = error as Error;
          if (err.name === 'NotAuthorizedException' && err.message.includes('Access Token has expired')) {
            try {
              const newAccessToken = await refreshAccessToken(user.refreshToken);
              user.accessToken = newAccessToken;
              fetchUserDetails();
            } catch (refreshError) {
              console.error('Error refreshing access token:', refreshError);
              router.push('/auth/login');
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
          const articleData = response.Items?.map(item => {
            const articleId = item.articleId?.S;
            const timestamp = item.timestamp?.S;
            const sourcePage = item.sourcePage?.S || '未知來源';

            if (articleId && timestamp) {
              return { articleId, timestamp, sourcePage };
            }
            return null;
          }).filter((data): data is { articleId: string; timestamp: string; sourcePage: string } => data !== null) || [];

          const articles = await Promise.all(articleData.map(async ({ articleId, timestamp, sourcePage }) => {
            const newsParams = {
              TableName: 'AWS_Blog_News',
              KeyConditionExpression: 'article_id = :articleId',
              ExpressionAttributeValues: {
                ':articleId': { S: articleId },
              },
            };
            const newsCommand = new QueryCommand(newsParams);
            const newsResponse = await dynamoClient.send(newsCommand);
            const translatedTitle = newsResponse.Items?.[0]?.translated_title?.S || '標題不可用';
            const link = newsResponse.Items?.[0]?.link?.S || '#';
            return { translatedTitle, link, timestamp, sourcePage };
          }));

          setRecentArticles(articles.slice(0, 10));
        } catch (error) {
          console.error('Error fetching recent articles:', error);
        }
      }
    };

    fetchRecentArticles();
  }, [user]);

  const refreshAccessToken = async (refreshToken: string): Promise<string> => {
    const newAccessToken = 'newAccessToken';
    return newAccessToken;
  };

  const handleSaveProfileChanges = async () => {
    let hasChanges = false;
    let changesSuccessful = true;

    if (!formData.username.trim()) {
      setPasswordMessage('用戶名不能為空。');
      return;
    }

    if (tempAvatar) {
      hasChanges = true;
      setFormData({ ...formData, avatar: tempAvatar });
      localStorage.setItem('avatarUrl', tempAvatar);

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
        setUploadMessage('頭像已功更新，頁面新中...');
      } catch (error) {
        console.error('Error updating DynamoDB:', error);
        setUploadMessage('更新頭像失敗，請再次嘗試。');
        changesSuccessful = false;
      }
    }

    if (tempUsername !== user?.username) {
      hasChanges = true;
      try {
        const updateUserCommand = new AdminUpdateUserAttributesCommand({
          UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
          Username: user?.sub!,
          UserAttributes: [
            {
              Name: 'name',
              Value: formData.username, // 使用 formData.username 而不是 tempUsername
            },
          ],
        });
        await cognitoClient.send(updateUserCommand);
        console.log('用戶名更新成功，頁面刷新中...');
        setUploadMessage('用戶名更新成功，頁面刷新中...');
        updateUser({ username: formData.username }); // 更新本地用戶名
      } catch (error) {
        console.error('更新用戶名時出錯:', error);
        const err = error as Error;
        if (err.name === 'UserNotFoundException') {
          console.error('用戶不存在，請檢查用戶名和用戶池 ID。');
        }
        setUploadMessage('更新戶名失敗，請稍後再試。');
        changesSuccessful = false;
      }
    }

    if (!hasChanges) {
      setUploadMessage('無任何變更項目');
    }

    setTempAvatar(null);

    if (hasChanges && changesSuccessful) {
      setIsLoading(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !formData.password) {
      setPasswordMessage('請輸入舊密碼和新密碼。');
      return;
    }

    try {
      const changePasswordCommand = new ChangePasswordCommand({
        PreviousPassword: oldPassword,
        ProposedPassword: formData.password,
        AccessToken: user?.accessToken!,
      });
      await cognitoClient.send(changePasswordCommand);
      console.log('密碼更新成功');
      setPasswordMessage('密碼變更成功，重新登入。');
      updateUser({ accessToken: user?.accessToken });

      setTimeout(() => {
        console.log('準備登出...');
        handleLogout();
      }, 2000);
    } catch (error) {
      console.error('更新密碼時出錯:', error as Error);
      if ((error as Error).name === 'LimitExceededException') {
        setPasswordMessage('嘗試次數過多，請稍後再試。');
      } else {
        setPasswordMessage('更新密碼失敗，請確認舊密碼是否正確並重試。');
      }
    }
  };

  const handleCancelChanges = () => {
    setIsEditing(false);
    setPasswordMessage(null);
    setOldPassword(''); // 清空舊密碼
    setFormData(prevData => ({ ...prevData, password: '' })); // 清空新密碼
    setIsEditable(prev => ({ ...prev, password: false }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData({ ...formData, [name]: target.checked });
    } else {
      setFormData({ ...formData, [name]: value }); // 確保這裡能更新 password
    }
  };

  const handleLogout = async () => {
    console.log('Logging out...');
    await logoutUser();
    router.push('/auth/login');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const validImageTypes = ['image/jpeg', 'image/png'];
      if (!validImageTypes.includes(file.type)) {
        setUploadMessage('上傳失敗：檔案類型不支援，確認檔案類型為 jpeg 或 png，頁面刷新中...');
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
        setFormData(prevData => ({ ...prevData, avatar: fileUrl }));
        localStorage.setItem('avatarUrl', fileUrl); // 確保本地存儲立即更新
        setUploadMessage('頭像更換成功，頁面刷新中...');

        //  DynamoDB 中的 avatarUrl
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
            ':avatarUrl': { S: fileUrl },
          },
        };

        try {
          const updateCommand = new UpdateItemCommand(updateParams);
          await dynamoClient.send(updateCommand);
          console.log('DynamoDB updated successfully');
          
          // 顯示通知消息 3 秒鐘後刷新頁面
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } catch (error) {
          console.error('Error updating DynamoDB:', error);
          setUploadMessage('更新頭像失敗，請再次嘗試。');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        setUploadMessage('上傳失敗：請稍後再試。');
      }
    }
  };

  const handleEditClick = () => {
    setTempUsername(user ? user.username : '');
    setOldPassword('');
    setFormData(prevData => ({ ...prevData, password: '' }));
    setIsEditable({
      username: false,
      password: false,
    });
    setUploadMessage(null);
    setIsEditing(true);
  };

  const handleOpenPasswordModal = () => {
    setIsPasswordModalOpen(true);
  };

  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setOldPassword(''); // 清空舊密碼
    setFormData(prevData => ({ ...prevData, password: '' })); // 清空新密碼
    setPasswordMessage(null);
  };

  const resetPasswordFields = () => {
    setOldPassword('');
    setFormData(prevData => ({ ...prevData, password: '' }));
  };

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  // 確保 setIsEditable 函數能正確更新狀態
  const toggleEditableField = (field: keyof EditableFields) => {
    setIsEditable(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // 模擬活動日誌數據
  useEffect(() => {
    setActivityLog([
      { date: '2023-10-24', action: '登入系統', details: 'IP: 192.168.1.1' },
      { date: '2023-10-23', action: '更新個人資料', details: '修改了用戶名' },
      { date: '2023-10-22', action: '密碼變更', details: '成功更改密碼' },
      { date: '2023-10-21', action: '新增裝置', details: '新的 iPhone 裝置登入' },
    ]);
  }, []);

  const logActivity = async (action: string) => {
    try {
      const dynamoClient = new DynamoDBClient({
        region: 'ap-northeast-1',
        credentials: {
          accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
        },
      });

      const formatDate = (date: Date) => {
        return date.toLocaleString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).replace(/\//g, '-');
      };

      const timestamp = formatDate(new Date());

      const putParams = {
        TableName: 'AWS_Blog_UserActivityLog',
        Item: {
          userId: { S: user?.sub || 'default-sub' },
          timestamp: { S: timestamp },
          action: { S: action },
          // 移除 details
        },
      };
      const putCommand = new PutItemCommand(putParams);
      await dynamoClient.send(putCommand);

      // 確保只保留最新的 6 筆
      const queryParams = {
        TableName: 'AWS_Blog_UserActivityLog',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': { S: user?.sub || 'default-sub' },
        },
        ScanIndexForward: true, // 獲取最舊的
      };

      const queryCommand = new QueryCommand(queryParams);
      const queryResponse = await dynamoClient.send(queryCommand);

      if (queryResponse.Items && queryResponse.Items.length > 6) {
        const oldestItem = queryResponse.Items[0];
        const deleteParams = {
          TableName: 'AWS_Blog_UserActivityLog',
          Key: {
            userId: { S: user?.sub || 'default-sub' },
            timestamp: { S: oldestItem.timestamp.S || '' }, // 確保 timestamp 不為 undefined
          },
        };
        const deleteCommand = new DeleteItemCommand(deleteParams);
        await dynamoClient.send(deleteCommand);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  // 在需要記錄活動的地方調用 logActivity
  useEffect(() => {
    if (user) {
      logActivity('登入系統'); // 移除 details
    }
  }, [user]);

  useEffect(() => {
    const fetchActivityLog = async () => {
      if (user) {
        const dynamoClient = new DynamoDBClient({
          region: 'ap-northeast-1',
          credentials: {
            accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
          },
        });

        const params = {
          TableName: 'AWS_Blog_UserActivityLog',
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': { S: user.sub },
          },
          ScanIndexForward: false,
          Limit: 6, // 修改為獲取最新的 6 筆
        };

        try {
          const command = new QueryCommand(params);
          const response = await dynamoClient.send(command);
          const logs = response.Items?.map(item => ({
            date: item.timestamp?.S || '',
            action: item.action?.S || '',
            details: '', // 添加默認的 details 屬性
          })) || [];

          setActivityLog(logs);
        } catch (error) {
          console.error('Error fetching activity log:', error);
        }
      }
    };

    fetchActivityLog();
  }, [user]);

  return {
    user,
    formData,
    recentArticles,
    isEditing,
    isPasswordModalOpen,
    showOldPassword,
    showNewPassword,
    uploadMessage,
    passwordMessage,
    isLoading,
    isEditable,
    setIsEditing,
    setTempAvatar,
    setFormData,
    setOldPassword,
    setIsPasswordModalOpen,
    setShowOldPassword,
    setShowNewPassword,
    handleSaveProfileChanges,
    handleChangePassword,
    handleLogout,
    handleAvatarChange,
    handleEditClick,
    handleOpenPasswordModal,
    handleClosePasswordModal,
    handleCancelChanges,
    handleChange,
    resetPasswordFields,
    toggleEditableField,
    activityLog,
  };
};
