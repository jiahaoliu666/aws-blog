// src/pages/_app.tsx  
import React from 'react';  
import Navbar from '../components/common/Navbar';  
import Footer from '../components/common/Footer';  
import { AppProps } from 'next/app';  
import '../styles/globals.css';  
import Head from 'next/head';  
import { AppProvider } from '../context/AppContext'; // This might be for other global states  

const MyApp: React.FC<AppProps> = ({ Component, pageProps }) => {  
  return (  
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