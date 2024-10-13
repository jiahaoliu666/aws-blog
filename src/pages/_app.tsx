// src/pages/_app.tsx  
import React from 'react';  
import { AppProps } from 'next/app';  
import { AuthProvider } from '../context/AuthContext';  
import { AppProvider } from '../context/AppContext';  
import '../styles/globals.css';  

function MyApp({ Component, pageProps }: AppProps) {  
  return (  
    <AuthProvider>  
      <AppProvider>  
        <Component {...pageProps} />  
      </AppProvider>  
    </AuthProvider>  
  );  
}  

export default MyApp;