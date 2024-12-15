import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SignUpCommand,
  InitiateAuthCommand,
  GlobalSignOutCommand,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import cognitoClient from "../utils/cognitoClient";
import { ExtendedNews } from "@/types/newsType";
import logActivity from '../pages/api/profile/activity-log'; // 引入 logActivity 函數
import { User } from '../types/userType';
import { logger } from '@/utils/logger';

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

  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchUserFromCognito = async () => {
      if (!isClient) return;
      
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        console.log('Stored user data:', parsedUser);
        setUser(parsedUser);
      }
    };

    fetchUserFromCognito();
  }, [isClient]);

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
        
        const user: User = {
          id: payload.sub,
          email,
          accessToken: authResult.AccessToken,
          refreshToken: authResult.RefreshToken || '',
          username: payload.name || email.split('@')[0],
          userId: payload.sub,
          sub: payload.sub
        };
        
        logger.info('用戶登入成功:', {
          hasId: !!user.id,
          hasUserId: !!user.userId,
          hasSub: !!user.sub,
          email: user.email
        });

        setUser(user);
        if (typeof window !== 'undefined') {
          localStorage.setItem("user", JSON.stringify(user));
        }
        return true;
      }
      return false;
    } catch (err) {
      setError(`登入失敗: ${err instanceof Error ? err.message : "未知錯誤"}`);
      return false;
    }
  };

  const logoutUser = async (): Promise<boolean> => {
    try {
      if (user) {
        const command = new GlobalSignOutCommand({ AccessToken: user.accessToken });
        await cognitoClient.send(command);
        setUser(null);
        window.localStorage.removeItem("user");
        setError(null);

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