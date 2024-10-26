// src/pages/_app.tsx
import React from 'react';
import { AppProps } from 'next/app';
import { AuthProvider } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';
import { LanguageProvider } from '../context/LanguageContext'; // 引入 LanguageProvider
import Head from 'next/head';
import '../styles/globals.css'; // 導入全局樣式
import 'dotenv/config'; // 確保在其他導入之前加載


function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AppProvider>
        <LanguageProvider>
            <Head>
              <title>AWS Blog</title> {/* 在這裡添加標題 */}
            </Head>
            <Component {...pageProps} />
        </LanguageProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default MyApp;
