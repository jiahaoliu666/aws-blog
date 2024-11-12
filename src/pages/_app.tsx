// src/pages/_app.tsx
import React from 'react';
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/context/AuthContext';
import { AppProvider } from '@/context/AppContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ToastProvider } from '@/context/ToastContext';
import Head from 'next/head';
import '@/styles/globals.css';
import '@/styles/toast.css';

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppProvider>
          <LanguageProvider>
            <Head>
              <title>AWS Blog 365</title>
            </Head>
            <Component {...pageProps} />
          </LanguageProvider>
        </AppProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default MyApp;
