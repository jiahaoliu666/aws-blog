// src/pages/_app.tsx  
import React from 'react';  
import Navbar from '../components/common/Navbar';  
import Footer from '../components/common/Footer';  
import { AppProps } from 'next/app';  
import '../styles/globals.css';  
import Head from 'next/head';  
import { AppProvider } from '../context/AppContext'; // 引入 AppProvider，提供全局上下文  

const MyApp: React.FC<AppProps> = ({ Component, pageProps }) => {  
  return (  
    // 使用 AppProvider 包裹應用程序，提供全局狀態管理  
    <AppProvider>  
      <Head>  
        <title>AWS Blog</title>  
      </Head>  
      <Navbar />   
      <Component {...pageProps} />    
      <Footer />  
    </AppProvider>  
  );  
};  

export default MyApp;