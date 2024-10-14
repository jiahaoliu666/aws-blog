// src/context/UserContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';  
import { CognitoIdentityProviderClient, GetUserCommand } from '@aws-sdk/client-cognito-identity-provider';  

interface UserContextProps {  
  username: string;  
  setUsername: (username: string) => void;  
}  

const UserContext = createContext<UserContextProps>({  
  username: '',  
  setUsername: () => {},  
});  

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {  
  const [username, setUsername] = useState('');  

  useEffect(() => {  
    const fetchUserName = async () => {  
      try {  
        const storedUser = localStorage.getItem('user');  
        if (storedUser) {  
          const { accessToken } = JSON.parse(storedUser);  

          const client = new CognitoIdentityProviderClient({  
            region: 'ap-northeast-1', // 不要忘記替換為您實際使用的AWS區域  
          });  

          const command = new GetUserCommand({  
            AccessToken: accessToken,  
          });  

          const response = await client.send(command);  
          const usernameAttribute = response.UserAttributes?.find(attr => attr.Name === 'email'); // 調整為代表您的用戶名或電子郵件的屬性名稱  

          if (usernameAttribute) {  
            setUsername(usernameAttribute.Value || '');  
          }  
        }  
      } catch (error) {  
        console.error("獲取用戶詳細信息時出錯:", error);  
      }  
    };  

    fetchUserName();  
  }, []);  

  return (  
    <UserContext.Provider value={{ username, setUsername }}>  
      {children}  
    </UserContext.Provider>  
  );  
};  

export const useUserContext = () => useContext(UserContext);