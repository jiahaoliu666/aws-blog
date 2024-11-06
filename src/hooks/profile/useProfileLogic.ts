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
import { toast } from 'react-toastify';
import { VerificationState, LineUserSettings } from '../../types/lineTypes';

interface EditableFields {
  username: boolean;
  password: boolean;
  [key: string]: boolean;  // 允許其他布林值屬性
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
  showEmailSettings: boolean;
  showLineSettings: boolean;
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
      logger.info(`用戶 ${lineId} 未追蹤方帳號`);
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
  user?: User | null;
}

interface NotificationSettings {
  emailNotification: boolean;
}

interface UpdateNotificationSettingsParams {
  userId?: string;
  emailNotification?: boolean;
  email?: string;
}

const updateNotificationSettings = async ({
  userId,
  emailNotification = true,
  email = ''
}: UpdateNotificationSettingsParams) => {
  if (!userId) return;

  const dynamoClient = new DynamoDBClient({
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const params = {
    TableName: 'AWS_Blog_UserNotificationSettings',
    Item: {
      userId: { S: userId },
      emailNotification: { BOOL: emailNotification },
      email: { S: email },
      updatedAt: { S: new Date().toISOString() }
    }
  };

  const command = new PutItemCommand(params);
  await dynamoClient.send(command);
};

interface ProfileLogicReturn {
  user: User | null;
  formData: FormData;
  localUsername: string;
  setLocalUsername: (username: string) => void;
  uploadMessage: string | null;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  isCompactLayout: boolean;
  setIsCompactLayout: React.Dispatch<React.SetStateAction<boolean>>;
  recentArticles: Article[];
  showOldPassword: boolean;
  showNewPassword: boolean;
  isLoading: boolean;
  isEditable: EditableFields;
  setTempAvatar: (url: string | null) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  setOldPassword: (password: string) => void;
  setShowOldPassword: (show: boolean) => void;
  setShowNewPassword: (show: boolean) => void;
  handleSaveProfileChanges: (username: string) => Promise<void>;
  handleChangePassword: () => Promise<void>;
  handleLogout: () => Promise<void>;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleEditClick: () => void;
  handleOpenPasswordModal: () => void;
  handleClosePasswordModal: () => void;
  handleCancelChanges: () => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  resetPasswordFields: () => void;
  toggleEditableField: (field: keyof EditableFields) => void;
  activityLog: { date: string; action: string; }[];
  oldPassword: string;
  calculatePasswordStrength: (password: string) => number;
  resetFeedbackForm: () => void;
  initializeTabState: () => void;
  resetUsername: () => void;
  passwordMessage: string | null;
  logRecentArticle: (articleId: string, link: string, sourcePage: string) => Promise<void>;
  handleSaveSettings: () => Promise<void>;
  sendFeedback: (resetFileInput: () => void) => Promise<void>;
  resetUploadState: () => void;
  lineUserId: string;
  setLineUserId: (id: string) => void;
  lineIdError: string;
  lineIdStatus: 'idle' | 'validating' | 'success' | 'error';
  settingsMessage: string | null;
  settingsStatus: 'success' | 'error' | null;
  toggleNotification: (type: 'email') => void;
  handleSaveNotificationSettings: (userId?: string) => Promise<void>;
  setLineIdStatus: (status: 'idle' | 'validating' | 'success' | 'error') => void;
  updateUser: (user: Partial<User>) => void;
  lineId: string;
  setLineId: React.Dispatch<React.SetStateAction<string>>;
  feedbackMessage: string | null;
  multicastMessage: string;
  setMulticastMessage: React.Dispatch<React.SetStateAction<string>>;
  isMulticasting: boolean;
  multicastResult: {
    status: 'success' | 'error' | null;
    message: string;
  };
  handleMulticast: () => Promise<void>;
  verificationState: VerificationState;
  verificationCode: string;
  setVerificationCode: React.Dispatch<React.SetStateAction<string>>;
  startVerification: () => Promise<void>;
  confirmVerificationCode: (code: string) => Promise<void>;
}

// 新增 Article 介面定義
interface Article {
  translatedTitle: string;
  link: string;
  timestamp: string;
  sourcePage: string;
}

export const useProfileLogic = ({ user = null }: UseProfileLogicProps = {}): ProfileLogicReturn => {
  const { user: authUser, updateUser, logoutUser } = useAuthContext();
  const router = useRouter();
  
  // 使用 authUser 作為後備
  const currentUser = user || authUser;
  
  // 初始化所有 state hooks
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    username: user?.username || '',
    email: user?.email || '',
    registrationDate: user?.registrationDate || '',
    avatar: user?.avatar || '/default-avatar.png',
    notifications: {
      email: false,
      line: false
    },
    password: '',
    confirmPassword: '',
    feedbackTitle: '',
    feedbackContent: '',
    showEmailSettings: false,
    showLineSettings: false,
  });
  const [oldPassword, setOldPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [isEditable, setIsEditable] = useState<EditableFields>({
    username: false,
    password: false
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
  const [lineUserId, setLineUserId] = useState('');
  const [lineIdError, setLineIdError] = useState('');
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
    emailNotification: false
  });
  const [isClient, setIsClient] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [settings, setSettings] = useState(null);


  const [notification, setNotification] = useState<{ message: string; status: 'success' | 'error' | null }>({
    message: '',
    status: null
  });

  const [multicastMessage, setMulticastMessage] = useState('');
  const [isMulticasting, setIsMulticasting] = useState(false);
  const [multicastResult, setMulticastResult] = useState<{
    status: 'success' | 'error' | null;
    message: string;
  }>({ status: null, message: '' });

  const [verificationState, setVerificationState] = useState<VerificationState>({
    step: 'idle',
    status: 'idle',
    message: '請先輸入您的 LINE ID 開始驗證'
  });

  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRY = 3;

  const handleVerificationRetry = async () => {
    if (retryCount >= MAX_RETRY) {
      setVerificationState({
        step: 'idle',
        status: 'error',
        message: '已超過最大重試次數，請稍後再試'
      });
      return;
    }
    setRetryCount(prev => prev + 1);
    await startVerification();
  };

  const handleMulticast = async () => {
    if (!multicastMessage.trim()) {
      toast.error('請輸入要發送的訊息');
      return;
    }

    try {
      setIsMulticasting(true);
      
      const response = await lineService.sendMulticast(multicastMessage);
      
      if (response.success) {
        setMulticastResult({
          status: 'success',
          message: '訊息發送成功'
        });
        setMulticastMessage(''); // 清空訊息
        toast.success('群發訊息已成功發送');
      } else {
        throw new Error(response.message || '發送失敗');
      }
    } catch (error) {
      logger.error('發送 Multicast 訊息時發生錯誤:', error);
      setMulticastResult({
        status: 'error',
        message: '發送訊息失敗，請稍後再試'
      });
      toast.error('發送訊息失敗');
    } finally {
      setIsMulticasting(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedSettings = localStorage.getItem('userSettings');
      if (cachedSettings) {
        setSettings(JSON.parse(cachedSettings));
      }
    }
  }, []);

  const fetchSettings = async () => {
    try {
      if (typeof window !== 'undefined') {
        const cachedTimestamp = localStorage.getItem('settingsCacheTimestamp');
        const CACHE_DURATION = 5 * 60 * 1000; // 5分鐘快取
        
        if (cachedTimestamp && Date.now() - Number(cachedTimestamp) < CACHE_DURATION) {
          return; // 使用快取的數據
        }
      }

      const response = await fetch('/api/notifications/settings');
      const data = await response.json();
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('userSettings', JSON.stringify(data));
        localStorage.setItem('settingsCacheTimestamp', Date.now().toString());
      }
      setSettings(data);
    } catch (error) {
      console.error('獲取設定時發生錯誤:', error);
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const storedUser = localStorage.getItem("user");
    if (!storedUser && !authUser) {
      router.push('/auth/login');
      return;
    }

    // 始表單資料
    const currentUser = authUser || (storedUser ? JSON.parse(storedUser) : null);
    if (currentUser) {
      setFormData(prevData => ({
        ...prevData,
        username: currentUser.username || '',
        email: currentUser.email || '',
        // ... other initializations
      }));
    }
  }, [authUser, router, isClient]);

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
          Limit: 12, // 確限制為12筆
        };

        try {
          const command = new QueryCommand(params);
          const response = await dynamoClient.send(command);
          const articleData = response.Items?.map(item => {
            const articleId = item.articleId?.S;
            const timestamp = item.timestamp?.S;
            const sourcePage = item.sourcePage?.S || '未知來';

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

          setRecentArticles(articles.slice(0, 12)); // 確保12筆
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
      setUploadMessage('戶名不為空。');
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
        setUploadMessage('用戶名新成功，頁新中...');
        updateUser({ username: localUsername });
        setFormData(prevData => ({ ...prevData, username: localUsername }));

        // Log the activity
        await logActivity(authUser?.sub || 'default-sub', `變更用戶${localUsername}`);
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
      // 基本證
      if (!oldPassword || !formData.password) {
        throw new Error('請輸入舊密碼和新密碼');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('新密碼和確認密不一致');
      }

      // 密碼強度
      const strength = calculatePasswordStrength(formData.password);
      if (strength < 3) {
        throw new Error('密碼強不足，請包含大小字母、數字特殊符號');
      }

      // 變密碼
      const changePasswordCommand = new ChangePasswordCommand({
        PreviousPassword: oldPassword,
        ProposedPassword: formData.password,
        AccessToken: authUser?.accessToken!,
      });

      await cognitoClient.send(changePasswordCommand);
      
      // 成功處理
      setPasswordMessage('密碼變更成功，請重新登入');
      await logActivity(authUser?.sub || 'default-sub', '變更碼');
      
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

    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
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
        setUploadMessage('上傳失敗檔類型不支援，請認檔案類型是否為 jpeg 或 png。');
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
        setUploadMessage('頭像更換成功，面刷新中...');

        // 記錄活動
        await logActivity(authUser?.sub || 'default-sub', '更換頭像');

        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } catch (error) {
        console.error('Error uploading file or updating profile:', error);
        setUploadMessage('上傳失敗：稍後再試。');
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
      feedbackImage: undefined
    }));
    setFeedbackMessage(null);
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

  const toggleNotification = (type: 'email') => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      },
      // 當切換 email 通知時，同時新 showEmailSettings
      showEmailSettings: type === 'email' ? !prev.notifications[type] : prev.showEmailSettings
    }));
  };

  const handleSaveNotificationSettings = async (userId?: string) => {
    try {
      if (!userId) {
        toast.error('找不到用戶ID');
        setSettingsMessage('找不到用戶ID');
        setSettingsStatus('error');
        return;
      }

      // 檢查是否有任何設定變更
      const currentEmailNotification = formData.notifications.email;
      const originalEmailNotification = notificationSettings.emailNotification;
      const hasChanges = currentEmailNotification !== originalEmailNotification;

      if (!hasChanges) {
        toast.info('沒有任何設定變更');
        setSettingsMessage('沒有任何設定變更');
        setSettingsStatus('error');
        return;
      }

      setIsLoading(true);
      
      await updateNotificationSettings({
        userId,
        emailNotification: currentEmailNotification,
        email: currentEmailNotification ? formData.email : ''
      });

      toast.success('通知設定已成功更新');
      setSettingsMessage('通知設定已成功更新');
      setSettingsStatus('success');
      await logActivity(userId, '更新通知設定');
      
      // 更新本地狀態
      setNotificationSettings({
        emailNotification: currentEmailNotification
      });
      
      // 延遲重新載入頁面
      setTimeout(() => {
        window.location.reload();
      }, 3000);

    } catch (error) {
      console.error('保存通知設定時發生錯誤:', error);
      toast.error('更新通知設定失敗');
      setSettingsMessage('更新通知設定失敗');
      setSettingsStatus('error');
    } finally {
      setIsLoading(false);
    }
  };


  const updateUserLineSettings = async ({
    lineId,
    isVerified,
    displayName
  }: {
    lineId: string;
    isVerified: boolean;
    displayName: string;
  }) => {
    const params = {
      TableName: 'AWS_Blog_UserNotificationSettings',
      Item: {
        userId: { S: authUser?.sub || '' },
        lineId: { S: lineId },
        isVerified: { BOOL: isVerified },
        displayName: { S: displayName },
        updatedAt: { S: new Date().toISOString() }
      }
    };

    const command = new PutItemCommand(params);
    await dynamoClient.send(command);
  };

  const handleSaveSettings = async (): Promise<void> => {
    try {
      if (!authUser?.sub) {
        throw new Error('找不到用戶ID');
      }
      
      await handleSaveNotificationSettings(authUser.sub);
      setSettingsMessage('定已成功儲存');
      setSettingsStatus('success');
    } catch (error) {
      setSettingsMessage('儲存設定失敗');
      setSettingsStatus('error');
    }
  };

  const resetUploadState = () => {
    setUploadMessage(null);
  };

  const sendFeedback = async (resetFileInput: () => void) => {
    try {
      if (!formData.feedbackTitle || !formData.feedbackContent) {
        setFeedbackMessage('請填寫標題和內容');
        return;
      }

      // 在此處理回饋提交邏輯
      setFeedbackMessage('回饋已成功送出');
      resetFileInput();
      
      // 修正: 確保返回完整的 FormData 結構
      setFormData(prevData => ({
        ...prevData,  // 保留所有現有屬性
        feedbackTitle: '',
        feedbackContent: '',
        feedbackImage: undefined
      }));
      
    } catch (error) {
      setFeedbackMessage('送出回饋時發生錯誤');
    }
  };

  // 修改 fetchNotificationSettings 函數，確保在獲取設定時同時更新 notificationSettings
  const fetchNotificationSettings = async (userId: string) => {
    try {
      const params = {
        TableName: 'AWS_Blog_UserNotificationSettings',
        Key: {
          userId: { S: userId }
        }
      };
      
      const command = new GetItemCommand(params);
      const response = await dynamoClient.send(command);
      
      if (response.Item) {
        const emailNotification = response.Item.emailNotification?.BOOL || false;
        
        // 同時更新 formData 和 notificationSettings
        setFormData(prev => ({
          ...prev,
          notifications: {
            ...prev.notifications,
            email: emailNotification
          }
        }));
        
        setNotificationSettings({
          emailNotification: emailNotification
        });
      }
    } catch (error) {
      console.error('獲取通知設定時發生錯誤:', error);
    }
  };

  // 在 useEffect 中獲取通知設定
  useEffect(() => {
    if (authUser?.sub) {
      fetchNotificationSettings(authUser.sub);
    }
  }, [authUser]);

  // 修改 startVerification 函數
  const startVerification = async () => {
    try {
      if (!user?.sub) {
        throw new Error('找不到用戶ID');
      }

      // 驗證 LINE ID 格式
      if (!lineId.match(/^U[0-9a-f]{32}$/)) {
        throw new Error('請輸入有效的 LINE ID');
      }

      setVerificationState({
        step: 'verifying',
        status: 'pending',
        message: '請在 LINE 官方帳號中發送驗證指令'
      });

      // 儲存 LINE ID 到資料庫
      await updateUserLineSettings({
        lineId,
        isVerified: false,
        displayName: user?.username || ''
      });

    } catch (error) {
      setVerificationState({
        step: 'idle',
        status: 'error',
        message: error instanceof Error ? error.message : '開始驗證失敗'
      });
    }
  };

  // 修改 confirmVerificationCode 函數
  const confirmVerificationCode = async (code: string) => {
    try {
      if (!user?.sub) {
        throw new Error('找不到用戶ID');
      }

      setVerificationState({
        step: 'confirming',
        status: 'validating',
        message: '正在驗證...'
      });

      const response = await fetch('/api/line/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.sub,
          lineId,
          code
        })
      });

      const data = await response.json();

      if (data.success) {
        setVerificationState({
          step: 'complete',
          status: 'success',
          message: '驗證成功！您現在可以接收 LINE 通知了'
        });
        
        // 更新設定
        await updateUserLineSettings({
          lineId,
          isVerified: true,
          displayName: user?.username || ''
        });

      } else {
        throw new Error(data.message || '驗證失敗');
      }
    } catch (error) {
      setVerificationState({
        step: 'confirming',
        status: 'error',
        message: error instanceof Error ? error.message : '驗證失敗，請稍後重試'
      });
    }
  };

  return {
    user: authUser,
    formData,
    localUsername,
    setLocalUsername,
    uploadMessage,
    activeTab,
    setActiveTab,
    isCompactLayout,
    setIsCompactLayout,
    recentArticles,
    showOldPassword,
    showNewPassword,
    isLoading,
    isEditable,
    setTempAvatar,
    setFormData,
    setOldPassword,
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
    resetUsername,
    passwordMessage,
    logRecentArticle,
    handleSaveSettings,
    sendFeedback,
    resetUploadState,
    lineUserId,
    setLineUserId,
    lineIdError,
    lineIdStatus,
    settingsMessage,
    settingsStatus,
    toggleNotification,
    handleSaveNotificationSettings,
    setLineIdStatus,
    updateUser,
    lineId,
    setLineId,
    feedbackMessage,
    multicastMessage,
    setMulticastMessage,
    isMulticasting,
    multicastResult,
    handleMulticast,
    verificationState,
    verificationCode,
    setVerificationCode,
    startVerification,
    confirmVerificationCode,
  };
};
