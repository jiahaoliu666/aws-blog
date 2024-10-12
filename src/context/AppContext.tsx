// src/context/AppContext.tsx  
import React, { createContext, useContext, ReactNode } from 'react';  
import { useAppLogic } from '../hooks/useAppLogic';  

// 定義 AppProvider 的屬性類型，包含子元素  
type AppProviderProps = {  
  children: ReactNode;  
};  

// 創建一個上下文，使用 useAppLogic 的返回類型作為上下文的類型  
const AppContext = createContext({} as ReturnType<typeof useAppLogic>);  

// 定義 AppProvider 組件，提供應用邏輯的上下文  
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {  
  const appLogic = useAppLogic();  // 使用自定義 Hook 獲取應用邏輯  
  // 將應用邏輯作為上下文的值提供給子組件  
  return <AppContext.Provider value={appLogic}>{children}</AppContext.Provider>;  
};  

// 自定義 Hook，用於在組件中使用 AppContext  
export const useAppContext = () => useContext(AppContext);

