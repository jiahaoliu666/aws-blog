// src/context/UserContext.tsx  
import React, { createContext, useContext, useState, ReactNode } from 'react';  

interface UserContextType {  
  username: string;  
  setUsername: (name: string) => void;  
}  

const UserContext = createContext<UserContextType | undefined>(undefined);  

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {  
  const [username, setUsername] = useState('');  

  return (  
    <UserContext.Provider value={{ username, setUsername }}>  
      {children}  
    </UserContext.Provider>  
  );  
};  

export const useUserContext = () => {  
  const context = useContext(UserContext);  
  if (!context) {  
    throw new Error('useUserContext must be used within a UserProvider');  
  }  
  return context;  
};