// src/pages/_app.tsx  
import React from 'react';  
import { AppProps } from 'next/app';  
import { AuthProvider } from '../context/AuthContext';  
import { AppProvider } from '../context/AppContext';  
import { UserProvider } from '../context/UserContext'; // 引入 UserProvider  
import '../styles/globals.css';  

function MyApp({ Component, pageProps }: AppProps) {  
  return (  
    <AuthProvider>  
      <AppProvider>   
        <UserProvider> {/* 包裹在 UserProvider 中 */}  
          <Component {...pageProps} />  
        </UserProvider>  
      </AppProvider>  
    </AuthProvider>  
  );  
}  

export default MyApp;