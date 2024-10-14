// src/context/AuthContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';  
import { useAuth } from '@/hooks/useAuth';  

interface AuthContextType {  
  user: { accessToken: string; username: string } | null;  
  registerUser: (email: string, password: string) => Promise<boolean>;  
  loginUser: (email: string, password: string) => Promise<boolean>;  
  logoutUser: () => Promise<boolean>;  
  error: string | null;  
  clearError: () => void;  
}  

const AuthContext = createContext<AuthContextType | undefined>(undefined);  

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {  
  const { user, registerUser, loginUser, logoutUser, error, clearError } = useAuth();  

  const value = {  
    user,  
    registerUser,  
    loginUser,  
    logoutUser,  
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