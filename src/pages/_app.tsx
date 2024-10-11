// src/pages/_app.tsx  
import React from 'react';  
import Navbar from '../components/common/Navbar';  
import Footer from '../components/common/Footer';  
import { AppProps } from 'next/app';  
import '../styles/globals.css';  
import Head from 'next/head';  
import { useAppLogic } from '@/hooks/useAppLogic'; // Import the custom hook  

const MyApp: React.FC<AppProps> = ({ Component, pageProps }) => {  
  const appLogic = useAppLogic(); // Use the custom hook  

  return (  
    <>  
      <Head>  
        <title>AWS Blog</title>  
      </Head>  
      <Navbar {...appLogic} /> {/* Spread the logic as props */}  
      <Component {...pageProps} />  
      <Footer />  
    </>  
  );  
};  

export default MyApp;