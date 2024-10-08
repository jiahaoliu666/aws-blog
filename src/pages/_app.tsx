// src/pages/_app.tsx
import React from 'react';  
import Navbar from '../components/Navbar';  
import Footer from '../components/Footer';  
import { AppProps } from 'next/app';  
import '../styles/globals.css'; // 引入全局 CSS  

const MyApp: React.FC<AppProps> = ({ Component, pageProps }) => {  
  return (  
    <>  
      <Navbar />  
      <Component {...pageProps} />  
      <Footer />  
    </>  
  );  
};  

export default MyApp;

