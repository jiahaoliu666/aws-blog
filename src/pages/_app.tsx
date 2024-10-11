// src/pages/_app.tsx
import React from 'react';  
import Navbar from '../components/Navbar';  
import Footer from '../components/Footer';  
import { AppProps } from 'next/app';  
import '../styles/globals.css'; // 引入全局 CSS  
import Head from 'next/head';  // 導入 Head  

const MyApp: React.FC<AppProps> = ({ Component, pageProps }) => {  
  return (  
    <>  
      <Head>  
        <title>AWS Blog</title>  {/* 設置標題 */}  
      </Head>  
      <Navbar />  
      <Component {...pageProps} />  
      <Footer />  
    </>  
  );  
};  

export default MyApp;