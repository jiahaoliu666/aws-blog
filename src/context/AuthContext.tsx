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
  BACKGROUND: 10 * 60 * 1000 // 背景狀態：每 10 分鐘
} as const;

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
  const [isVisible, setIsVisible] = useState(true);
  const router = useRouter();

  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "";

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 只保留頁面可見性監聽
  useEffect(() => {
    if (!isClient) return;

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isClient]);

  // 修改檢查間隔的函數
  const getCheckInterval = (): number => {
    return !isVisible ? CHECK_INTERVALS.BACKGROUND : CHECK_INTERVALS.ACTIVE;
  };

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
  const clearAllStorages = async () => {
    try {
      logger.info('開始清除所有本地存儲');

      // 1. 清除 localStorage
      const localStorageKeys = Object.keys(localStorage);
      localStorageKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          logger.warn(`清除 localStorage key ${key} 失敗:`, e);
        }
      });
      localStorage.clear();
      
      // 2. 清除 sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage);
      sessionStorageKeys.forEach(key => {
        try {
          sessionStorage.removeItem(key);
        } catch (e) {
          logger.warn(`清除 sessionStorage key ${key} 失敗:`, e);
        }
      });
      sessionStorage.clear();
      
      // 3. 清除所有 cookies
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        try {
          const [name] = cookie.trim().split('=');
          if (name) {
            // 使用多個路徑確保完全清除
            const paths = ['/', '/api', '/auth', '/profile'];
            paths.forEach(path => {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
            });
          }
        } catch (e) {
          logger.warn(`清除 cookie ${cookie} 失敗:`, e);
        }
      });

      // 4. 特別處理 next-auth 相關的 cookies
      const nextAuthCookies = [
        'next-auth.session-token',
        'next-auth.csrf-token',
        'next-auth.callback-url',
        'next-auth.state',
        '__Secure-next-auth.session-token',
        '__Host-next-auth.csrf-token'
      ];
      nextAuthCookies.forEach(cookieName => {
        try {
          document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;secure;samesite=lax`;
        } catch (e) {
          logger.warn(`清除 next-auth cookie ${cookieName} 失敗:`, e);
        }
      });

      // 5. 清除 IndexedDB 資料（如果有的話）
      const deleteIndexedDB = async () => {
        try {
          const databases = await window.indexedDB.databases();
          databases.forEach(db => {
            if (db.name) {
              window.indexedDB.deleteDatabase(db.name);
            }
          });
        } catch (e) {
          logger.warn('清除 IndexedDB 失敗:', e);
        }
      };
      await deleteIndexedDB();

      // 6. 驗證清除結果
      const verifyStorageClear = () => {
        const isLocalStorageCleared = localStorage.length === 0;
        const isSessionStorageCleared = sessionStorage.length === 0;
        const isCookiesCleared = document.cookie.split(';').every(cookie => cookie.trim() === '');

        if (!isLocalStorageCleared || !isSessionStorageCleared || !isCookiesCleared) {
          throw new Error('存儲清除驗證失敗');
        }
      };
      verifyStorageClear();

      // 7. 設置登出標記
      sessionStorage.setItem('isLoggedOut', 'true');
      sessionStorage.setItem('logoutTimestamp', Date.now().toString());

      logger.info('所有本地存儲清除完成');
      return true;
    } catch (error) {
      logger.error('清除本地存儲時發生錯誤:', {
        error: error instanceof Error ? error.message : '未知錯誤',
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  };

  // 執行自動登出
  const performAutoLogout = async () => {
    try {
      // 1. 先清除所有本地存儲
      const isStorageCleared = await clearAllStorages();
      if (!isStorageCleared) {
        throw new Error('清除本地存儲失敗');
      }
      
      // 2. 設置用戶狀態為 null
      setUser(null);
      
      // 3. 添加登出標記防止自動恢復
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('isLoggedOut', 'true');
        sessionStorage.setItem('logoutTimestamp', Date.now().toString());
        
        // 觸發登出事件
        window.dispatchEvent(new Event('logout'));
      }

      // 4. 驗證登出狀態
      const verifyLogoutState = () => {
        const hasUser = localStorage.getItem('user');
        const hasToken = localStorage.getItem('token');
        const hasPreferences = localStorage.getItem('userPreferences');
        if (hasUser || hasToken || hasPreferences) {
          throw new Error('用戶數據清除驗證失敗');
        }
      };
      verifyLogoutState();
      
      // 5. 如果不在登入頁面，則重導向到登入頁面
      if (router.pathname !== '/auth/login') {
        await router.push('/auth/login');
      }

      logger.info('用戶登出成功，所有狀態已清除');
      return true;
    } catch (error) {
      logger.error('執行自動登出時發生錯誤:', {
        error: error instanceof Error ? error.message : '未知錯誤',
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  };

  const logoutUser = async (): Promise<boolean> => {
    try {
      if (user) {
        // 1. 嘗試執行 Cognito 登出
        try {
          const command = new GlobalSignOutCommand({ AccessToken: user.accessToken });
          await cognitoClient.send(command);
        } catch (error) {
          // 即使 Cognito 登出失敗，仍繼續本地登出流程
          logger.warn('Cognito 登出失敗，繼續執行本地登出:', error);
        }

        // 2. 執行本地登出流程
        await performAutoLogout();
        return true;
      }
    } catch (err) {
      setError(`登出失敗: ${err instanceof Error ? err.message : "未知錯誤"}`);
      return false;
    }
    return false;
  };

  // 使用動態間隔的檢查機制
  useEffect(() => {
    const validateCurrentUser = async () => {
      if (!isClient) return;

      try {
        // 檢查是否有登出標記
        const isLoggedOut = sessionStorage.getItem('isLoggedOut') === 'true';
        const logoutTimestamp = sessionStorage.getItem('logoutTimestamp');
        
        // 如果有登出標記且在30分鐘內，保持登出狀態
        if (isLoggedOut && logoutTimestamp) {
          const thirtyMinutes = 30 * 60 * 1000;
          if (Date.now() - parseInt(logoutTimestamp) < thirtyMinutes) {
            return;
          }
        }

        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          // 如果沒有存儲的用戶數據，但當前狀態有用戶，則清除狀態
          if (user) {
            setUser(null);
          }
          return;
        }

        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser.accessToken) {
          // 如果存儲的用戶數據沒有 token，執行登出流程
          await performAutoLogout();
          return;
        }

        // 如果目前沒有用戶狀態，但有存儲的用戶資料，則恢復用戶狀態
        if (!user && parsedUser.accessToken) {
          setUser(parsedUser);
        }

        // 避免頻繁驗證，增加節流
        const lastValidationTime = sessionStorage.getItem('lastValidationTime');
        const now = Date.now();
        if (lastValidationTime && (now - parseInt(lastValidationTime)) < 60000) { // 1分鐘內不重複驗證
          return;
        }
        sessionStorage.setItem('lastValidationTime', now.toString());

        // 驗證 token 是否有效
        try {
          const command = new AdminGetUserCommand({
            UserPoolId: userPoolId,
            Username: parsedUser.sub
          });
          
          const response = await cognitoClient.send(command);
          
          if (response.UserAttributes) {
            const userAttributes = response.UserAttributes.reduce((acc, attr) => {
              if (attr.Name && attr.Value) {
                acc[attr.Name] = attr.Value;
              }
              return acc;
            }, {} as Record<string, string>);

            // 更新用戶資訊
            const updatedUserData: User = {
              ...parsedUser,
              email: userAttributes.email || parsedUser.email,
              username: userAttributes.name || parsedUser.username,
              accessToken: parsedUser.accessToken,
              refreshToken: parsedUser.refreshToken
            };

            localStorage.setItem("user", JSON.stringify(updatedUserData));
            setUser(updatedUserData);

            logger.info('用戶狀態已更新:', {
              userId: parsedUser.sub,
              hasToken: !!updatedUserData.accessToken,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          if (error instanceof UserNotFoundException) {
            logger.warn('用戶已不存在，執行自動登出:', {
              userSub: parsedUser.sub,
              timestamp: new Date().toISOString()
            });
            await performAutoLogout();
            return;
          }
          
          // 其他錯誤不應該立即導致登出
          logger.error('驗證用戶時發生錯誤:', {
            error: error instanceof Error ? error.message : '未知錯誤',
            userSub: parsedUser.sub
          });
          
          // 如果是網絡錯誤或其他臨時性錯誤，不執行登出
          if (error instanceof Error && 
              (error.message.includes('Network') || 
               error.message.includes('timeout') || 
               error.message.includes('rate exceeded'))) {
            return;
          }

          // 如果是認證相關的錯誤，執行登出
          if (error instanceof Error && 
              (error.message.includes('token') || 
               error.message.includes('authentication') || 
               error.message.includes('unauthorized'))) {
            await performAutoLogout();
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
        isVisible,
        lastActivity: new Date(Date.now()).toISOString(),
        hasUser: !!user
      });
      validateCurrentUser();
    }, getCheckInterval());

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isClient, isVisible, user, userPoolId]);

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