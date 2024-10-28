import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SignUpCommand,
  InitiateAuthCommand,
  GlobalSignOutCommand,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import cognitoClient from "../utils/cognitoClient";
import { ExtendedNews } from "@/types/newsType";

interface User {
  accessToken: string;
  refreshToken: string;
  username: string;
  sub: string;
  email: string;
  favorites?: ExtendedNews[];
}

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

  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";

  useEffect(() => {
    const fetchUserFromCognito = async () => {
      const storedUser = localStorage.getItem("user");
      console.log('Checking stored user:', storedUser);
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        try {
          const userCommand = new GetUserCommand({ AccessToken: parsedUser.accessToken });
          const userResponse = await cognitoClient.send(userCommand);

          const nameAttribute = userResponse.UserAttributes?.find(attr => attr.Name === 'name');
          const userIdAttribute = userResponse.UserAttributes?.find(attr => attr.Name === 'sub');

          const username = nameAttribute ? nameAttribute.Value || parsedUser.email : parsedUser.email;

          if (!userIdAttribute || !userIdAttribute.Value) {
            throw new Error("無法獲取用戶的 ID（sub）。");
          }
          const userId = userIdAttribute.Value;

          const updatedUser: User = { 
            ...parsedUser, 
            username, 
            sub: userId 
          };

          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } catch (err) {
          console.error("無法從 Cognito 獲取用戶資料: ", err);
          setUser(null);
          localStorage.removeItem("user");
        }
      }
    };

    fetchUserFromCognito();
  }, []);

  const registerUser = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const date = new Date();
      const registrationDate = date.toISOString().split('T')[0];
      const command = new SignUpCommand({
        ClientId: clientId,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "name", Value: name },
          { Name: "custom:registrationDate", Value: registrationDate },
        ],
      });

      await cognitoClient.send(command);
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

      if (authResult && authResult.AccessToken && authResult.RefreshToken) {
        const accessToken = authResult.AccessToken;
        const refreshToken = authResult.RefreshToken;

        const userCommand = new GetUserCommand({ AccessToken: accessToken });
        const userResponse = await cognitoClient.send(userCommand);

        const nameAttribute = userResponse.UserAttributes?.find(attr => attr.Name === 'name');
        const userIdAttribute = userResponse.UserAttributes?.find(attr => attr.Name === 'sub');

        const username = nameAttribute ? nameAttribute.Value || email : email;

        if (!userIdAttribute || !userIdAttribute.Value) {
          throw new Error("無法獲取用戶的 ID（sub）。");
        }
        const userId = userIdAttribute.Value;

        const user: User = { accessToken, refreshToken, username, sub: userId, email, favorites: [] };
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));

        return true;
      }
    } catch (err) {
      setError(`登入失敗: ${err instanceof Error ? err.message : "未知錯誤"}`);
      return false;
    }
    return false;
  };

  const logoutUser = async (): Promise<boolean> => {
    try {
      if (user) {
        const command = new GlobalSignOutCommand({ AccessToken: user.accessToken });
        await cognitoClient.send(command);
        setUser(null);
        localStorage.removeItem("user");
        setError(null);

        return true;
      }
    } catch (err) {
      setError(`登出失敗: ${err instanceof Error ? err.message : "未知錯誤"}`);
      return false;
    }
    return false;
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
    }
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
    throw new Error('useAuthContext 必須在 AuthProvider 中使用');
  }
  return context;
};
