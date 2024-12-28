// src/pages/_app.tsx
import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { AuthProvider } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ToastProvider } from '@/context/ToastContext';
import { LoadingProvider, useLoading } from '@/context/LoadingContext';
import Head from 'next/head';
import '@/styles/globals.css';
import '@/styles/toast.css';
import { ThemeProvider } from '@/context/ThemeContext';
import '@aws-amplify/ui-react/styles.css';

// 建立一個包裝組件來處理路由變化和 Discord Bot 初始化
const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    const handleStart = () => startLoading();
    const handleComplete = () => stopLoading();

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return <>{children}</>;
};

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <title>AWS Blog 365</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <LoadingProvider>
        <ToastProvider>
          <AuthProvider>
            <ThemeProvider>
              <AppProvider>
                <LanguageProvider>
                  <AppInitializer>
                    <Component {...pageProps} />
                  </AppInitializer>
                </LanguageProvider>
              </AppProvider>
            </ThemeProvider>
          </AuthProvider>
        </ToastProvider>
      </LoadingProvider>
    </>
  );
};

export default MyApp;