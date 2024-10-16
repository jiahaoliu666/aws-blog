// src/pages/_app.tsx
import React from 'react';
import { AppProps } from 'next/app';
import { AuthProvider } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';
import { LanguageProvider } from '../context/LanguageContext'; // 引入 LanguageProvider
import '../styles/globals.css'; // 導入全局樣式

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AppProvider>
        <LanguageProvider> {/* 將 LanguageProvider 包裹在這裡 */}
          <Component {...pageProps} />
        </LanguageProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default MyApp;
