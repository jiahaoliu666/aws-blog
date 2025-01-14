import React, { createContext, useContext, ReactNode } from 'react';
import { useAppLogic } from '../hooks/useAppLogic';

type AppProviderProps = {
  children: ReactNode;
};

const AppContext = createContext({} as ReturnType<typeof useAppLogic>);

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const appLogic = useAppLogic();
  return <AppContext.Provider value={appLogic}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);