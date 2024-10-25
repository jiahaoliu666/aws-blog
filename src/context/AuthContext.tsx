import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SignUpCommand,
  InitiateAuthCommand,
  GlobalSignOutCommand,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import cognitoClient from "../utils/cognitoClient";
import { ExtendedNews } from "@/types/newsType";
import { DynamoDBClient, PutItemCommand, QueryCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb'; // 引入 DynamoDBClient 和 PutItemCommand

interface User {
  accessToken: string;
  refreshToken: string; // 新增 refreshToken 屬性
  username: string;
  sub: string;
  email: string; // 新增 email 屬性
  favorites?: ExtendedNews[];
}

interface AuthContextType {
  user: User | null;
  registerUser: (email: string, password: string, name: string) => Promise<boolean>;
  loginUser: (email: string, password: string) => Promise<boolean>;
  logoutUser: () => Promise<boolean>;
  updateUser: (updatedUser: Partial<User>) => void; // 新增 updateUser 函數
  error: string | null;
  clearError: () => void;
  saveArticleView: (articleId: string, userId: string, sourcePage: string) => Promise<void>; // 新增 saveArticleView 函數
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";

  useEffect(() => {
    const fetchUserFromCognito = async () => {
      const storedUser = localStorage.getItem("user");
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
      const registrationDate = date.toISOString().split('T')[0]; // 只取日期部分
      const command = new SignUpCommand({
        ClientId: clientId,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "name", Value: name },
          { Name: "custom:registrationDate", Value: registrationDate }, // 使用 YYYY-MM-DD 格式
        ],
      });

      console.log("SignUpCommand:", command);

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

        // 記錄登入活動
        await logActivity(userId, '登入系統'); // 確保這裡傳入 userId 而不是 userResponse.Username

        return true;
      }
    } catch (err) {
      setError(`登入失敗: ${err instanceof Error ? err.message : "未知錯誤"}`);
      return false;
    }
    return false; // 確保函數在所有情況下都有返回值
  };

  const logoutUser = async (): Promise<boolean> => {
    try {
      if (user) {
        const command = new GlobalSignOutCommand({ AccessToken: user.accessToken });
        await cognitoClient.send(command);
        setUser(null);
        localStorage.removeItem("user");
        console.log("User logged out and username cleared");
        setError(null);
        return true;
      }
      return false;
    } catch (err) {
      setError(`登出失敗: ${err instanceof Error ? err.message : "未知錯誤"}`);
      return false;
    }
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
    }
  };

  const clearError = () => {
    console.log("清除錯誤");
    setError(null);
  };

  const saveArticleView = async (articleId: string, userId: string, sourcePage: string) => {
    const dynamoClient = new DynamoDBClient({
        region: 'ap-northeast-1',
        credentials: {
            accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
        },
    });

    const timestamp = new Date().toISOString();

    // 新增觀看紀錄
    const putParams = {
        TableName: 'AWS_Blog_UserRecentArticles',
        Item: {
            userId: { S: userId },
            timestamp: { S: timestamp },
            articleId: { S: articleId },
            sourcePage: { S: sourcePage },
        },
    };
    const putCommand = new PutItemCommand(putParams);
    await dynamoClient.send(putCommand);
    console.log('Article view saved successfully');

    // 查詢所有觀看紀錄
    const queryParams = {
        TableName: 'AWS_Blog_UserRecentArticles',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': { S: userId },
        },
        ScanIndexForward: false, // 以時間倒序排列
    };
    const queryCommand = new QueryCommand(queryParams);
    const response = await dynamoClient.send(queryCommand);

    // 如果紀錄超過 10 則，刪除多餘的
    const items = response.Items || [];
    if (items.length > 10) {
        const itemsToDelete = items.slice(10); // 取出多餘的紀錄
        for (const item of itemsToDelete) {
            const deleteParams = {
                TableName: 'AWS_Blog_UserRecentArticles',
                Key: {
                    userId: item.userId,
                    timestamp: item.timestamp,
                },
            };
            const deleteCommand = new DeleteItemCommand(deleteParams);
            await dynamoClient.send(deleteCommand);
            console.log('Deleted old article view:', item.articleId.S);
        }
    }
  };

  const value = {
    user,
    registerUser,
    loginUser,
    logoutUser,
    updateUser,
    saveArticleView,
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

// 新增 logActivity 函數
const logActivity = async (userId: string, action: string) => {
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
      userId: { S: userId },
      timestamp: { S: timestamp },
      action: { S: action },
    },
  };
  const putCommand = new PutItemCommand(putParams);
  await dynamoClient.send(putCommand);
};
