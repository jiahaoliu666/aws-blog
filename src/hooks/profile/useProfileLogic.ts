import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../context/AuthContext';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, QueryCommand, UpdateItemCommand, DeleteItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { CognitoIdentityProviderClient, GetUserCommand, AdminUpdateUserAttributesCommand, ChangePasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import logActivity from '../../pages/api/profile/activity-log';

interface EditableFields {
  username: boolean;
  password: boolean;
}

interface FormData {
  username: string;
  email: string;
  registrationDate: string;
  avatar: string;
  notifications: {
    line: boolean;
    email: boolean;
  };
  password: string;
  confirmPassword: string;
  feedbackTitle: string;
  feedbackContent: string;
  feedbackImage?: File; // 新增這一行
}

export const useProfileLogic = () => {
  const router = useRouter();
  const { user, logoutUser, updateUser } = useAuthContext();
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    username: user ? user.username : '',
    email: user ? user.email : '',
    registrationDate: '[註冊日期]',
    avatar: 'user.png',
    notifications: {
      line: false,
      email: false,
    },
    password: '',
    confirmPassword: '',
    feedbackTitle: '',
    feedbackContent: '',
    feedbackImage: undefined, 
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
  const [activityLog, setActivityLog] = useState<{ date: string; action: string; }[]>([]);
  const [localUsername, setLocalUsername] = useState(user ? user.username : '');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAvatar = localStorage.getItem('avatarUrl');
      if (storedAvatar) {
        setFormData(prevData => ({ ...prevData, avatar: storedAvatar }));
      }
    }
  }, []);

  useEffect(() => {
    // 獲取當前路徑
    const currentPath = router.pathname;

    // 僅在訪問 /profile 頁面時執行重定向
    if (user === null && currentPath === '/profile') {
      console.log('User is null, redirecting to login from profile page...');
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
          const registrationDate = registrationDateAttribute ? registrationDateAttribute.Value : '[註]';

          setFormData(prevData => ({
            ...prevData,
            registrationDate: registrationDate || '[註日期]',
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
          Limit: 12, // 確保限制為12筆
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

          setRecentArticles(articles.slice(0, 12)); // 確保顯示12筆
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

  const handleSaveProfileChanges = async (localUsername: string) => {
    let hasChanges = false;
    let changesSuccessful = true;

    if (!localUsername.trim()) {
      setUploadMessage('用戶名��能為空。');
      console.log('用戶名不能為空。');
      return;
    }

    if (localUsername !== user?.username) {
      hasChanges = true;
      try {
        const updateUserCommand = new AdminUpdateUserAttributesCommand({
          UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
          Username: user?.sub!,
          UserAttributes: [
            {
              Name: 'name',
              Value: localUsername,
            },
          ],
        });
        await cognitoClient.send(updateUserCommand);
        setUploadMessage('用戶名更新成功，頁面刷新中...');
        console.log('用戶名更新成功頁面刷新中...');
        updateUser({ username: localUsername });
        setFormData(prevData => ({ ...prevData, username: localUsername }));

        // Log the activity
        await logActivity(user?.sub || 'default-sub', `變更用戶名：${localUsername}`);
      } catch (error) {
        console.error('更新用戶名時出錯:', error);
        setUploadMessage('更新用戶名失敗，稍後再試。');
        console.log('更新用戶名失敗，請稍後再試。');
        changesSuccessful = false;
      }
    }

    if (!hasChanges) {
      setUploadMessage('無任何變更項目');
      console.log('無任何變更項目');
    }

    if (hasChanges && changesSuccessful) {
      setIsLoading(true);
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  };

  const handleChangePassword = async () => {
    console.log('handleChangePassword called');
    const passwordRegex = /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;

    if (!oldPassword || !formData.password) {
      setPasswordMessage('請輸入舊密碼和新密碼。');
      console.log('Missing old or new password');
      return;
    }

    if (!passwordRegex.test(formData.password)) {
      setPasswordMessage('密碼只能包含殊符號、英文和數字。');
      return;
    }

    if (formData.password === oldPassword) {
      setPasswordMessage('新密碼不能與舊密碼相同。');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setPasswordMessage('新密碼和確認密碼不一致。');
      return;
    }

    try {
      const changePasswordCommand = new ChangePasswordCommand({
        PreviousPassword: oldPassword,
        ProposedPassword: formData.password,
        AccessToken: user?.accessToken!,
      });
      await cognitoClient.send(changePasswordCommand);
      setPasswordMessage('密碼變更成功，請重新登入。');
      
      // Log the password change activity
      await logActivity(user?.sub || 'default-sub', '變更密碼');

      setTimeout(() => {
        handleLogout(); // 在這裡調用登出函數
      }, 3000); // 3秒後登出
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordMessage('更新密碼失敗，請確認舊密碼是否正確並重試。');
    }
  };

  const handleCancelChanges = () => {
    setIsEditing(false);
    setTempUsername(user ? user.username : '');
    setIsEditable(prev => ({ ...prev, username: false }));
    setFormData(prevData => ({ ...prevData, username: user ? user.username : '' }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData({ ...formData, [name]: target.checked });
    } else {
      if (name === 'username') {
        setTempUsername(value);
      } else {
        setFormData({ ...formData, [name]: value });
      }
    }
  };

  const handleLogout = async () => {
    console.log('Logging out...');
    await logActivity(user?.sub || 'default-sub', '登出系統');
    await logoutUser();
    router.push('/auth/login');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const validImageTypes = ['image/jpeg', 'image/png'];
      if (!validImageTypes.includes(file.type)) {
        setUploadMessage('上傳失敗：檔案類型不支援，請確認檔案類型是否為 jpeg 或 png。');
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
        localStorage.setItem('avatarUrl', fileUrl);
        setUploadMessage('頭像更換成功，頁面刷新中...');

        // Log the activity
        await logActivity(user?.sub || 'default-sub', '更換頭像');

        setTimeout(() => {
          window.location.reload();
        }, 3000);
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
    setOldPassword('');
    setFormData(prevData => ({ ...prevData, password: '' }));
    setPasswordMessage(null);
  };

  const resetPasswordFields = () => {
    setOldPassword('');
    setFormData(prevData => ({ ...prevData, password: '', confirmPassword: '' }));
  };

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const toggleEditableField = (field: keyof EditableFields) => {
    setIsEditable(prev => ({ ...prev, [field]: !prev[field] }));
  };

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
          Limit: 12, // 確保限制為12筆
        };

        try {
          const command = new QueryCommand(params);
          const response = await dynamoClient.send(command);
          console.log('Fetched activity log:', response.Items); // 添加日誌輸出
          const logs = response.Items?.map(item => ({
            date: item.timestamp?.S || '',
            action: item.action?.S || '',
          })) || [];

          setActivityLog(logs);
        } catch (error) {
          console.error('Error fetching activity log:', error);
        }
      }
    };

    fetchActivityLog();
  }, [user]);

  useEffect(() => {
    if (uploadMessage) {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [uploadMessage]);

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const resetFeedbackForm = () => {
    setFormData(prevData => ({
      ...prevData,
      feedbackTitle: '',
      feedbackContent: '',
    }));
  };

  const initializeTabState = () => {
    setIsEditing(false);
    setTempUsername(user ? user.username : '');
    setLocalUsername(user ? user.username : ''); // 重置 localUsername
    setIsEditable({
      username: false,
      password: false,
    });
    setFormData(prevData => ({
      ...prevData,
      password: '',
      confirmPassword: '',
      feedbackTitle: '',
      feedbackContent: '',
    }));
    setUploadMessage(null);
    setPasswordMessage(null);
  };

  useEffect(() => {
    if (user) {
      setLocalUsername(user.username);
    }
  }, [user]);

  const resetUsername = () => {
    setLocalUsername(user ? user.username : '');
  };

  const logRecentArticle = async (articleId: string, link: string, sourcePage: string) => {
    try {
        const dynamoClient = new DynamoDBClient({
            region: 'ap-northeast-1',
            credentials: {
                accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
            },
        });

        const timestamp = new Date().toISOString();

        const putParams = {
            TableName: 'AWS_Blog_UserRecentArticles',
            Item: {
                userId: { S: user?.sub || 'default-sub' },
                articleId: { S: articleId },
                timestamp: { S: timestamp },
                link: { S: link },
                sourcePage: { S: sourcePage },
            },
        };
        const putCommand = new PutItemCommand(putParams);
        await dynamoClient.send(putCommand);
        console.log(`Recent article logged: ${articleId} at ${timestamp}`);

        // Fetch all articles to check the count
        const queryParams = {
            TableName: 'AWS_Blog_UserRecentArticles',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': { S: user?.sub || 'default-sub' },
            },
            ScanIndexForward: true, // Ascending order to get the oldest first
        };
        const queryCommand = new QueryCommand(queryParams);
        const response = await dynamoClient.send(queryCommand);

        if (response.Items && response.Items.length > 12) {
            // Delete the oldest article
            const oldestArticle = response.Items[0];
            if (oldestArticle.timestamp.S) {
                const deleteParams = {
                    TableName: 'AWS_Blog_UserRecentArticles',
                    Key: {
                        userId: { S: user?.sub || 'default-sub' },
                        timestamp: { S: oldestArticle.timestamp.S },
                    },
                };
                const deleteCommand = new DeleteItemCommand(deleteParams);
                await dynamoClient.send(deleteCommand);
                console.log(`Oldest article deleted with timestamp: ${oldestArticle.timestamp.S}`);
            } else {
                console.error('Error: timestamp is undefined');
            }
        }
    } catch (error) {
        console.error('Error logging recent article:', error);
    }
  };

  const toggleNotification = (type: 'line' | 'email') => {
    setFormData(prevData => ({
      ...prevData,
      notifications: {
        ...prevData.notifications,
        [type]: !prevData.notifications[type],
      },
    }));
  };

  const handleSaveNotificationSettings = async () => {
    try {
      // 在這裡添加代碼來更新後端的用戶設置
      console.log('通知設置已保存:', formData.notifications);
      // 例如，調用 API 來保存設置
    } catch (error) {
      console.error('保存通知設置時發生錯誤:', error);
    }
  };

  const sendFeedback = async (onSuccess?: () => void) => {
    if (!formData.feedbackTitle.trim() || !formData.feedbackContent.trim()) {
      setFeedbackMessage('請填寫反饋標題和內容。');
      return;
    }

    try {
      let imageBase64 = '';
      if (formData.feedbackImage) {
        const validImageTypes = ['image/jpeg', 'image/png'];
        if (!validImageTypes.includes(formData.feedbackImage.type)) {
          setFeedbackMessage('上傳失敗：檔案類型不支援，請確認檔案類型是否為 jpeg 或 png。');
          return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(formData.feedbackImage);
        imageBase64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject('Error reading file');
        });
      }

      const feedbackData = {
        title: formData.feedbackTitle,
        content: formData.feedbackContent,
        email: formData.email,
        image: imageBase64,
      };

      const response = await fetch('/api/profile/sendFeedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      if (response.ok) {
        console.log('反饋已成功發送');
        setFeedbackMessage('已將反饋成功提交，感謝您寶貴的意見！');
        resetFeedbackForm();
        await logActivity(user?.sub || 'default-sub', '提交意見反饋');
        if (onSuccess) onSuccess();
      } else {
        setFeedbackMessage('發送反饋時出錯');
      }
    } catch (error) {
      setFeedbackMessage('發送反饋時發生錯誤');
    }
  };

  const resetUploadState = () => {
    setFormData(prevData => ({
      ...prevData,
      feedbackImage: undefined, // 重置上傳的圖片
    }));
    setFeedbackMessage(null); // 隱藏消息通知
  };

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
    oldPassword,
    calculatePasswordStrength,
    resetFeedbackForm,
    initializeTabState,
    localUsername,
    setLocalUsername,
    resetUsername,
    logRecentArticle,
    toggleNotification,
    handleSaveNotificationSettings,
    sendFeedback,
    feedbackMessage,
    resetUploadState,
  };
};
