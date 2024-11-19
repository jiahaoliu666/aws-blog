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
import { ThemeProvider } from '@/context/ThemeContext';

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <title>AWS Blog 365</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <ToastProvider>
        <AuthProvider>
          <ThemeProvider>
            <AppProvider>
              <LanguageProvider>
                <div className="min-h-screen flex flex-col">
                  <Component {...pageProps} />
                </div>
              </LanguageProvider>
            </AppProvider>
          </ThemeProvider>
        </AuthProvider>
      </ToastProvider>
    </>
  );
};

export default MyApp;
