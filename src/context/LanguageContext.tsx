// src/context/LanguageContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

// 定義上下文的類型
interface LanguageContextType {
    language: string; // 當前語言
    setLanguage: (lang: string) => void; // 設置語言的函數
}

// 創建上下文，設置初始值為 undefined
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 上下文提供者組件
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<string>('zh-TW'); // 默認語言設置為繁體中文

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

// 自定義 Hook，用於使用上下文
export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage 必須在 LanguageProvider 內部使用'); // 確保上下文在提供者內部使用
    }
    return context;
};
