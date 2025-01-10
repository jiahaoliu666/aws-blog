import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SignUpCommand,
  InitiateAuthCommand,
  GlobalSignOutCommand,
  GetUserCommand,
  AdminGetUserCommand,
  UserNotFoundException
} from "@aws-sdk/client-cognito-identity-provider";
import cognitoClient from "../utils/cognitoClient";
import { ExtendedNews } from "@/types/newsType";
import logActivity from '../pages/api/profile/activity-log';
import { User } from '../types/userType';
import { logger } from '@/utils/logger';
import { useRouter } from 'next/router';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';

// 檢查頻率設定（毫秒）
const CHECK_INTERVALS = {
  ACTIVE: 2 * 60 * 1000,    // 活躍狀態：每 2 分鐘
  IDLE: 5 * 60 * 1000,      // 閒置狀態：每 5 分鐘
  BACKGROUND: 10 * 60 * 1000 // 背景狀態：每 10 分鐘
} as const;

const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 分鐘沒有操作視為閒置

interface AuthContextType {
  user: User | null;
  registerUser: (email: string, password: string, name: string) => Promise<boolean>;
  loginUser: (email: string, password: string) => Promise<boolean>;
  logoutUser: () => Promise<boolean>;
  updateUser: (updatedUser: Partial<User>) => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [isIdle, setIsIdle] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "";

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 更新最後活動時間
  const updateLastActivity = () => {
    setLastActivity(Date.now());
    setIsIdle(false);
  };

  // 監聽用戶活動
  useEffect(() => {
    if (!isClient) return;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => {
      updateLastActivity();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // 監聽頁面可見性變化
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isClient]);

  // 根據用戶狀態決定檢查頻率
  const getCheckInterval = (): number => {
    if (!isVisible) {
      return CHECK_INTERVALS.BACKGROUND;
    }
    if (isIdle) {
      return CHECK_INTERVALS.IDLE;
    }
    return CHECK_INTERVALS.ACTIVE;
  };

  // 檢查是否閒置
  useEffect(() => {
    if (!isClient) return;

    const checkIdleStatus = () => {
      const now = Date.now();
      if (now - lastActivity >= IDLE_TIMEOUT) {
        setIsIdle(true);
      }
    };

    const idleCheckInterval = setInterval(checkIdleStatus, 60000); // 每分鐘檢查一次閒置狀態

    return () => clearInterval(idleCheckInterval);
  }, [isClient, lastActivity]);

  // 驗證用戶是否仍然存在並更新用戶資訊
  const validateAndUpdateUser = async (userSub: string): Promise<boolean> => {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: userSub
      });
      
      const response = await cognitoClient.send(command);
      
      // 如果用戶存在且當前有用戶狀態，更新用戶資訊
      if (response.UserAttributes && user) {
        const userAttributes = response.UserAttributes.reduce((acc, attr) => {
          if (attr.Name && attr.Value) {
            acc[attr.Name] = attr.Value;
          }
          return acc;
        }, {} as Record<string, string>);

        // 更新用戶資訊，保持必要欄位的存在
        const updatedUserData: User = {
          ...user,
          id: user.id,
          email: userAttributes.email || user.email,
          username: userAttributes.name || user.username,
          avatar: userAttributes.picture || user.avatar,
          userId: user.userId,
          sub: user.sub,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken
        };

        // 更新 localStorage 和狀態
        if (typeof window !== 'undefined') {
          localStorage.setItem("user", JSON.stringify(updatedUserData));
        }
        setUser(updatedUserData);
        
        logger.info('用戶資訊已更新:', {
          userSub,
          hasAvatar: !!updatedUserData.avatar,
          timestamp: new Date().toISOString()
        });
      }
      
      return true;
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        logger.warn('用戶已不存在，執行自動登出:', { 
          userSub,
          timestamp: new Date().toISOString()
        });
        return false;
      }
      logger.error('驗證用戶時發生錯誤:', {
        error,
        userSub,
        timestamp: new Date().toISOString()
      });
      return true;
    }
  };

  // 清除所有本地存儲
  const clearAllStorages = () => {
    try {
      // 清除 localStorage
      localStorage.clear();
      
      // 清除 sessionStorage
      sessionStorage.clear();
      
      // 清除所有 cookies
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name) {
          ['/', '/api', '/auth', '/profile'].forEach(path => {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
          });
        }
      });

      // 特別處理 next-auth cookies
      [
        'next-auth.session-token',
        'next-auth.csrf-token',
        'next-auth.callback-url',
        'next-auth.state',
        '__Secure-next-auth.session-token',
        '__Host-next-auth.csrf-token'
      ].forEach(cookieName => {
        document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;secure;samesite=lax`;
      });

      logger.info('所有本地存儲已清除');
    } catch (error) {
      logger.error('清除本地存儲時發生錯誤:', error);
    }
  };

  // 執行自動登出
  const performAutoLogout = async () => {
    setUser(null);
    clearAllStorages();
    
    // 如果不在登入頁面，則重導向到登入頁面
    if (router.pathname !== '/auth/login') {
      await router.push('/auth/login');
    }
  };

  // 使用動態間隔的檢查機制
  useEffect(() => {
    const validateCurrentUser = async () => {
      if (!isClient) return;

      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // 如果目前沒有用戶狀態，但有存儲的用戶資料，則恢復用戶狀態
          if (!user && parsedUser.sub) {
            setUser(parsedUser);
          }

          // 只有在有用戶資料時才進行驗證和更新
          if (parsedUser.sub) {
            const command = new AdminGetUserCommand({
              UserPoolId: userPoolId,
              Username: parsedUser.sub
            });
            
            try {
              const response = await cognitoClient.send(command);
              
              // 如果用戶存在，更新用戶資訊
              if (response.UserAttributes) {
                const userAttributes = response.UserAttributes.reduce((acc, attr) => {
                  if (attr.Name && attr.Value) {
                    acc[attr.Name] = attr.Value;
                  }
                  return acc;
                }, {} as Record<string, string>);

                // 從 DynamoDB 獲取額外的用戶資訊（如頭像）
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
                    ':userId': { S: parsedUser.sub },
                  },
                };

                const queryCommand = new QueryCommand(queryParams);
                const dynamoResponse = await dynamoClient.send(queryCommand);
                
                const avatarUrl = dynamoResponse.Items?.[0]?.avatarUrl?.S;

                // 更新用戶資訊，保持必要欄位的存在
                const updatedUserData: User = {
                  ...parsedUser,
                  email: userAttributes.email || parsedUser.email,
                  username: userAttributes.name || parsedUser.username,
                  avatar: avatarUrl || parsedUser.avatar,
                  accessToken: parsedUser.accessToken,
                  refreshToken: parsedUser.refreshToken
                };

                // 更新 localStorage 和狀態
                localStorage.setItem("user", JSON.stringify(updatedUserData));
                setUser(updatedUserData);

                // 如果頭像有更新，觸發全局事件
                if (avatarUrl && avatarUrl !== parsedUser.avatar) {
                  window.dispatchEvent(new CustomEvent('avatarUpdate', { detail: avatarUrl }));
                }
                
                logger.info('用戶資訊已更新:', {
                  userSub: parsedUser.sub,
                  hasAvatar: !!avatarUrl,
                  timestamp: new Date().toISOString()
                });
              }
              return true;
            } catch (error) {
              if (error instanceof UserNotFoundException) {
                logger.warn('用戶已不存在，執行自動登出:', {
                  userSub: parsedUser.sub,
                  timestamp: new Date().toISOString()
                });
                await performAutoLogout();
                return false;
              }
              throw error;
            }
          }
        }
      } catch (error) {
        logger.error('驗證用戶狀態時發生錯誤:', {
          error: error instanceof Error ? error.message : '未知錯誤',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    };

    // 初始檢查和頁面重整時執行
    validateCurrentUser();

    // 監聽頁面可見性變化，當頁面從隱藏變為可見時更新用戶資訊
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.sub) {
        validateCurrentUser();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 設定動態檢查間隔
    const intervalId = setInterval(() => {
      const interval = getCheckInterval();
      logger.debug('執行用戶驗證檢查:', {
        interval: interval / 1000,
        isIdle,
        isVisible,
        lastActivity: new Date(lastActivity).toISOString(),
        hasUser: !!user
      });
      validateCurrentUser();
    }, getCheckInterval());

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isClient, isIdle, isVisible, lastActivity]);

  const registerUser = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const command = new SignUpCommand({
        ClientId: clientId,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "name", Value: name }
        ],
      });

      const response = await cognitoClient.send(command);
      
      if (response.UserSub) {
        localStorage.setItem('tempRegistration', JSON.stringify({
          email,
          userSub: response.UserSub,
          timestamp: Date.now()
        }));
      }
      
      setError(null);
      return true;
    } catch (err) {
      setError(`註冊失敗: ${err instanceof Error ? err.message : "未知錯誤"}`);
      return false;
    }
  };

  const loginUser = async (email: string, password: string): Promise<boolean> => {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const response = await cognitoClient.send(command);
      const authResult = response.AuthenticationResult;

      if (authResult?.AccessToken) {
        const payload = JSON.parse(Buffer.from(authResult.IdToken!.split('.')[1], 'base64').toString());
        
        const userData: User = {
          id: payload.sub,
          email,
          accessToken: authResult.AccessToken,
          refreshToken: authResult.RefreshToken || '',
          username: payload.name || email.split('@')[0],
          userId: payload.sub,
          sub: payload.sub,
          registrationDate: payload.auth_time ? new Date(payload.auth_time * 1000).toISOString() : undefined
        };
        
        logger.info('用戶登入成功:', {
          hasId: !!userData.id,
          hasUserId: !!userData.userId,
          hasSub: !!userData.sub,
          email: userData.email,
          timestamp: new Date().toISOString()
        });

        // 先儲存到 localStorage，再更新狀態
        if (typeof window !== 'undefined') {
          localStorage.setItem("user", JSON.stringify(userData));
        }
        setUser(userData);
        setError(null);
        updateLastActivity(); // 更新最後活動時間
        
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "未知錯誤";
      logger.error('登入失敗:', {
        error: errorMessage,
        email,
        timestamp: new Date().toISOString()
      });
      setError(`登入失敗: ${errorMessage}`);
      return false;
    }
  };

  const logoutUser = async (): Promise<boolean> => {
    try {
      if (user) {
        const command = new GlobalSignOutCommand({ AccessToken: user.accessToken });
        await cognitoClient.send(command);
        await performAutoLogout();
        return true;
      }
    } catch (err) {
      setError(`登出失敗: ${err instanceof Error ? err.message : "未知錯誤"}`);
      return false;
    }
    return false;
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        ...userData,
        sub: userData.sub || prev.sub
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem("user", JSON.stringify(updated));
      }
      
      return updated;
    });
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    registerUser,
    loginUser,
    logoutUser,
    updateUser,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext 必須在 AuthProvider 使用');
  }
  return context;
};