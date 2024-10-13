// src/hooks/useAuth.ts  
import { useState, useEffect } from "react";  
import {  
  SignUpCommand,  
  InitiateAuthCommand,  
  GlobalSignOutCommand,  
} from "@aws-sdk/client-cognito-identity-provider";  
import cognitoClient from "../utils/cognitoClient";  

interface User {  
  accessToken: string;  
}  

export function useAuth() {  
  const [user, setUser] = useState<User | null>(null);  
  const [error, setError] = useState<string | null>(null);  

  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";  

  useEffect(() => {  
    const storedUser = localStorage.getItem("user");  
    if (storedUser) {  
      setUser(JSON.parse(storedUser));  
    }  
  }, []);  

  const registerUser = async (email: string, password: string): Promise<boolean> => {  
    try {  
      const command = new SignUpCommand({  
        ClientId: clientId,  
        Username: email,  
        Password: password,  
        UserAttributes: [{ Name: "email", Value: email }],  
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
      if (authResult && authResult.AccessToken) {  
        const user = { accessToken: authResult.AccessToken };  
        setUser(user);  
        localStorage.setItem("user", JSON.stringify(user));  
        setError(null);  
        return true;  
      } else {  
        throw new Error("登入失敗：認證結果未定義。");  
      }  
    } catch (err) {  
      const errorMessage = `登入失敗: ${err instanceof Error ? err.message : "未知錯誤"}`;  
      console.log("設置錯誤信息: ", errorMessage);  
      setError(errorMessage);  
      return false;  
    }  
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
      return false;  
    } catch (err) {  
      setError(`登出失敗: ${err instanceof Error ? err.message : "未知錯誤"}`);  
      return false;  
    }  
  };  

  const clearError = () => {  
    console.log("Clearing error");  
    setError(null);  
  };  

  return { user, registerUser, loginUser, logoutUser, error, clearError };  
}