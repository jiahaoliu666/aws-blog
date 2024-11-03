// src/pages/_app.tsx
import React from 'react';
import { AppProps } from 'next/app';
import { AuthProvider } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';
import { LanguageProvider } from '../context/LanguageContext'; 
import Head from 'next/head';
import '../styles/globals.css'; 
import 'dotenv/config'; 


function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AppProvider>
        <LanguageProvider>
            <Head>
              <title>AWS Blog 365</title> 
              <link rel="icon" href="/logo.png" />
            </Head>
            <Component {...pageProps} />
        </LanguageProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default MyApp;
