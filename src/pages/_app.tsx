// src/pages/_app.tsx   
import React from 'react';  
import { AppProps } from 'next/app';  
import { AuthProvider } from '../context/AuthContext';  
import { AppProvider } from '../context/AppContext';  
// 'UserProvider' 已被移除   
import '../styles/globals.css';  

function MyApp({ Component, pageProps }: AppProps) {  
  return (  
    <AuthProvider>  
      <AppProvider>  
        {/* 'UserProvider' 被移除，直接渲染 Component */}  
        <Component {...pageProps} />  
      </AppProvider>  
    </AuthProvider>  
  );  
}  

export default MyApp;