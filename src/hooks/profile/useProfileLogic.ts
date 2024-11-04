import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../../context/AuthContext';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, QueryCommand, UpdateItemCommand, DeleteItemCommand, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { CognitoIdentityProviderClient, GetUserCommand, AdminUpdateUserAttributesCommand, ChangePasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import logActivity from '../../pages/api/profile/activity-log';
import { lineConfig } from "../../config/line";
import { logger } from "../../utils/logger";
import { lineService } from '../../services/lineService';
import { User } from '../../types/userType';

interface EditableFields {
  username: boolean;
  password: boolean;
}

interface FormData {
  username: string;
  email: string;
  registrationDate: string;
  avatar: string;
  password: string;
  confirmPassword: string;
  feedbackTitle: string;
  feedbackContent: string;
  feedbackImage?: File;
  notifications: {
    email: boolean;
    line: boolean;
  };
}

const checkLineFollowStatus = async (lineId: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://api.line.me/v2/bot/profile/${lineId}`,
      {
        headers: {
          Authorization: `Bearer ${lineConfig.channelAccessToken}`,
        },
      }
    );

    if (response.ok) {
      return true;
    }

    const error = await response.json();
    if (error.message?.includes('not found')) {
      logger.info(`用戶 ${lineId} 未追蹤官方帳號`);
      return false;
    }

    throw new Error(error.message);
  } catch (error) {
    logger.error('檢查 LINE 追蹤狀態時發生錯誤:', error);
    return false;
  }
};

interface SaveSettingsResponse {
  success: boolean;
  message: string;
}

interface UseProfileLogicProps {
  user: User | null;
}

interface NotificationSettings {
  lineId: string;
  lineNotification: boolean;
  emailNotification: boolean;
}

export const useProfileLogic = ({ user }: UseProfileLogicProps = { user: null }) => {
  const { user: authUser, updateUser, logoutUser } = useAuthContext();
  const router = useRouter();
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(() => ({
    username: authUser?.username || '',
    email: authUser?.email || '',
    registrationDate: authUser?.registrationDate || '',
    avatar: authUser?.avatar || '',
    password: '',
    confirmPassword: '',
    feedbackTitle: '',
    feedbackContent: '',
    notifications: {
      email: false,
      line: false
    }
  }));
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
  const [tempUsername, setTempUsername] = useState(authUser ? authUser.username : '');
  const [recentArticles, setRecentArticles] = useState<{ translatedTitle: string; link: string; timestamp: string; sourcePage: string }[]>([]);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [activityLog, setActivityLog] = useState<{ date: string; action: string; }[]>([]);
  const [localUsername, setLocalUsername] = useState(authUser ? authUser.username : '');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [lineUserId, setLineUserId] = useState<string>('');
  const [lineIdError, setLineIdError] = useState<string>('');
  const [lineIdStatus, setLineIdStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [lineVerificationTimer, setLineVerificationTimer] = useState<NodeJS.Timeout | null>(null);
  const dynamoClient = new DynamoDBClient({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });
  const [lineId, setLineId] = useState('');
  const [lineNotification, setLineNotification] = useState(false);
  const [message, setMessage] = useState('');
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [settingsStatus, setSettingsStatus] = useState<'success' | 'error' | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    lineId: '',
    lineNotification: false,
    emailNotification: false
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAvatar = localStorage.getItem('avatarUrl');
      if (storedAvatar) {
        setFormData(prevData => ({ ...prevData, avatar: storedAvatar }));
      }
    }
  }, []);

  useEffect(() => {
    if (!authUser) {
      router.push('/auth/login');
      return;
    }

    // 初始化表單資料
    setFormData(prevData => ({
      ...prevData,
      username: authUser.username || '',
      email: authUser.email || '',
      // ... other initializations
    }));
  }, [authUser, router]);

  useEffect(() => {
    const fetchRecentArticles = async () => {
      if (authUser) {
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
            ':userId': { S: authUser.sub },
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

          setRecentArticles(articles.slice(0, 12)); // 確保顯12筆
        } catch (error) {
          console.error('Error fetching recent articles:', error);
        }
      }
    };

    fetchRecentArticles();
  }, [authUser]);

  const refreshAccessToken = async (refreshToken: string): Promise<string> => {
    const newAccessToken = 'newAccessToken';
    return newAccessToken;
  };

  const handleSaveProfileChanges = async (localUsername: string) => {
    let hasChanges = false;
    let changesSuccessful = true;

    if (!localUsername.trim()) {
      setUploadMessage('戶名不能為空。');
      return;
    }

    if (localUsername !== authUser?.username) {
      hasChanges = true;
      try {
        const updateUserCommand = new AdminUpdateUserAttributesCommand({
          UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
          Username: authUser?.sub!,
          UserAttributes: [
            {
              Name: 'name',
              Value: localUsername,
            },
          ],
        });
        await cognitoClient.send(updateUserCommand);
        setUploadMessage('用戶名更新成功，頁面刷新中...');
        updateUser({ username: localUsername });
        setFormData(prevData => ({ ...prevData, username: localUsername }));

        // Log the activity
        await logActivity(authUser?.sub || 'default-sub', `變更用戶：${localUsername}`);
      } catch (error) {
        setUploadMessage('更新用戶名失敗，稍後再試。');
        changesSuccessful = false;
      }
    }

    if (!hasChanges) {
      setUploadMessage('無任何變更項目');
    }

    if (hasChanges && changesSuccessful) {
      setIsLoading(true);
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  };

  const handleChangePassword = async () => {
    try {
      // 基本驗證
      if (!oldPassword || !formData.password) {
        throw new Error('請輸入舊密碼和新密碼');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('新密碼和確認密碼不一致');
      }

      // 密碼強度驗證
      const strength = calculatePasswordStrength(formData.password);
      if (strength < 3) {
        throw new Error('密碼強度不足，請包含大小寫字母、數字和特殊符號');
      }

      // 變更密碼
      const changePasswordCommand = new ChangePasswordCommand({
        PreviousPassword: oldPassword,
        ProposedPassword: formData.password,
        AccessToken: authUser?.accessToken!,
      });

      await cognitoClient.send(changePasswordCommand);
      
      // 成功處理
      setPasswordMessage('密碼變更成功，請重新登入');
      await logActivity(authUser?.sub || 'default-sub', '變更密碼');
      
      // 延遲登出
      setTimeout(handleLogout, 3000);

    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : '密碼變更失敗');
    }
  };

  const handleCancelChanges = () => {
    setIsEditing(false);
    setTempUsername(authUser ? authUser.username : '');
    setIsEditable(prev => ({ ...prev, username: false }));
    setFormData(prevData => ({ ...prevData, username: authUser ? authUser.username : '' }));
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
    await logActivity(authUser?.sub || 'default-sub', '登出系統');
    await logoutUser();
    router.push('/auth/login');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const validImageTypes = ['image/jpeg', 'image/png'];
      if (!validImageTypes.includes(file.type)) {
        setUploadMessage('上傳失敗檔案類型不支援，請確認檔案類型是否為 jpeg 或 png。');
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

      const userSub = authUser?.sub || 'default-sub';

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
        console.log('File uploaded successfully:', fileUrl);
        setTempAvatar(fileUrl);
        setFormData(prevData => ({ ...prevData, avatar: fileUrl }));
        localStorage.setItem('avatarUrl', fileUrl);
        setUploadMessage('頭像更換成功，頁面刷新中...');

        // 記錄活動
        await logActivity(authUser?.sub || 'default-sub', '更換頭像');

        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } catch (error) {
        console.error('Error uploading file or updating profile:', error);
        setUploadMessage('上傳失敗：請稍後再試。');
      }
    }
  };

  const handleEditClick = () => {
    setTempUsername(authUser ? authUser.username : '');
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
      if (authUser) {
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
            ':userId': { S: authUser.sub },
          },
          ScanIndexForward: false,
          Limit: 12, // 確保限制為12筆
        };

        try {
          const command = new QueryCommand(params);
          const response = await dynamoClient.send(command);
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
  }, [authUser]);

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
    setTempUsername(authUser ? authUser.username : '');
    setLocalUsername(authUser ? authUser.username : ''); // 重置 localUsername
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
    if (authUser) {
      setLocalUsername(authUser.username);
    }
  }, [authUser]);

  const resetUsername = () => {
    setLocalUsername(authUser ? authUser.username : '');
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
                userId: { S: authUser?.sub || 'default-sub' },
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
                ':userId': { S: authUser?.sub || 'default-sub' },
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
                        userId: { S: authUser?.sub || 'default-sub' },
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

  const toggleNotification = (type: 'email' | 'line'): void => {
    setFormData((prev: FormData) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  };

  const validateLineId = (id: string) => {
    if (!id) return false;
    // LINE ID 格式驗證: 允許英文字母、數、底線、點號，長度在4-20之間
    const lineIdRegex = /^[A-Za-z0-9._-]{4,20}$/;
    return lineIdRegex.test(id);
  };

  const handleLineIdChange = async (value: string) => {
    setLineUserId(value);
    setLineIdStatus('validating');
    
    if (lineVerificationTimer) {
      clearTimeout(lineVerificationTimer);
    }

    const timer = setTimeout(async () => {
      if (!value) {
        setLineIdError('請輸入LINE ID');
        setLineIdStatus('error');
        return;
      }
      
      if (!validateLineId(value)) {
        setLineIdError('LINE ID 格式不正確，應為4-20個字元，只能包含英文、數字、底線和點號');
        setLineIdStatus('error');
        return;
      }

      try {
        const response = await fetch('/api/line/check-follow-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ lineId: value }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || '驗證失敗');
        }
        
        if (data.isFollowing) {
          setLineIdError('');
          setLineIdStatus('success');
          setUploadMessage('LINE 帳號驗證成功！您將可以收到最新文章知。');
        } else {
          setLineIdError('先追蹤 LINE 官方帳號才能接收通知');
          setLineIdStatus('error');
        }
      } catch (error) {
        logger.error('LINE ID 驗證失敗:', error);
        setLineIdError('驗證過程發生錯誤，請稍後再試');
        setLineIdStatus('error');
      }
    }, 500);

    setLineVerificationTimer(timer);
  };

  const validateSettings = (settings: {
    lineId: string;
    lineNotification: boolean;
    emailNotification: boolean;
  }): { isValid: boolean; message: string } => {
    if (settings.lineNotification && !settings.lineId.trim()) {
      return {
        isValid: false,
        message: '啟用 LINE 通知時必須提供有效的 LINE ID',
      };
    }

    if (!settings.lineNotification && !settings.emailNotification) {
      return {
        isValid: false,
        message: '請至少啟用一種通知方式',
      };
    }

    return { isValid: true, message: '' };
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      setSettingsMessage(null);
      setSettingsStatus(null);

      // 驗證設定
      if (notificationSettings.lineNotification && !notificationSettings.lineId.trim()) {
        setSettingsMessage('啟用 LINE 通知時必須提供有效的 LINE ID');
        setSettingsStatus('error');
        return;
      }

      // 檢查 LINE 追蹤狀態
      if (notificationSettings.lineNotification) {
        const isFollowing = await checkLineFollowStatus(notificationSettings.lineId);
        if (!isFollowing) {
          setSettingsMessage('請先追官方 LINE 帳號');
          setSettingsStatus('error');
          return;
        }
      }

      // 儲存設定
      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser?.sub,
          ...notificationSettings
        }),
      });

      if (!response.ok) {
        throw new Error('儲存設定失敗');
      }

      setSettingsMessage('設定已成功儲存');
      setSettingsStatus('success');
      await logActivity(authUser?.sub || 'default-sub', '更新通知設定');

    } catch (error) {
      setSettingsMessage(error instanceof Error ? error.message : '儲存設定時發生錯誤');
      setSettingsStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const sendFeedback = async (resetFileInput: () => void) => {
    if (!formData.feedbackTitle || !formData.feedbackContent) {
      setFeedbackMessage('請填寫標題和內容');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('email', formData.email);
      formDataToSend.append('title', formData.feedbackTitle);
      formDataToSend.append('content', formData.feedbackContent);
      if (formData.feedbackImage) {
        formDataToSend.append('image', formData.feedbackImage);
      }

      const response = await fetch('/api/profile/sendFeedback', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('發送反饋失敗');
      }

      setFeedbackMessage('反饋已成功提交');
      resetFeedbackForm();
      resetFileInput();
      setTimeout(() => setFeedbackMessage(''), 3000);
    } catch (error) {
      setFeedbackMessage('提交反饋時發生錯誤');
    }
  };

  const resetUploadState = () => {
    setFormData(prevData => ({
      ...prevData,
      feedbackImage: undefined, // 重置上傳的圖片
    }));
    setFeedbackMessage(null); // 隱藏消息通知
  };

  useEffect(() => {
    const fetchNotificationSettings = async () => {
      if (authUser) {
        try {
          const params = {
            TableName: 'AWS_Blog_UserNotificationSettings',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
              ':userId': { S: authUser.sub },
            },
          };

          const command = new QueryCommand(params);
          const response = await dynamoClient.send(command);

          if (response.Items && response.Items.length > 0) {
            const settings = response.Items[0];
            setFormData(prevData => ({
              ...prevData,
              notifications: {
                email: settings.emailNotification?.BOOL || false,
                line: settings.lineNotification?.BOOL || false,
              },
            }));
            // 設置 LINE ID
            if (settings.lineUserId?.S) {
              setLineUserId(settings.lineUserId.S);
            }
          }
        } catch (error) {
          console.error('獲取通知設置時發生錯誤:', error);
        }
      }
    };

    fetchNotificationSettings();
  }, [authUser]);

  const handleSaveNotificationSettings = async (userId?: string) => {
    if (!userId) {
      setUploadMessage('找不到用戶ID');
      return;
    }

    try {
      setIsLoading(true);
      
      // 檢查 LINE 通知設定
      if (formData.notifications.line && !lineUserId) {
        setUploadMessage('啟用 LINE 通知時必須提供有效的 LINE ID');
        return;
      }

      const params = {
        TableName: 'AWS_Blog_UserNotificationSettings',
        Item: {
          userId: { S: userId },
          lineUserId: { S: lineUserId },
          emailNotification: { BOOL: formData.notifications.email },
          lineNotification: { BOOL: formData.notifications.line },
          updatedAt: { S: new Date().toISOString() }
        }
      };

      const command = new PutItemCommand(params);
      await dynamoClient.send(command);

      setUploadMessage('通知設定已成功更新');
      await logActivity(userId, '更新通知設定');
      
    } catch (error) {
      console.error('保存通知設定時發生錯誤:', error);
      setUploadMessage('更新通知設定失敗');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user: authUser,
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
    handleSaveSettings,
    settingsMessage,
    settingsStatus,
    feedbackMessage,
    resetUploadState,
    isMobile,
    lineUserId,
    setLineUserId,
    lineIdError,
    lineIdStatus,
    handleLineIdChange,
    lineId,
    setLineId,
    lineNotification,
    setLineNotification,
    message,
    setMessage,
    sendFeedback,
    handleSaveNotificationSettings,
  };
};
