// src/components/Navbar.tsx
import React from 'react';  
import Link from 'next/link';  

const Navbar: React.FC = () => {  
  return (  
    <nav className="bg-gray-800 p-4">  
      <div className="container mx-auto flex justify-between items-center">  
        <div className="text-white">  
          <Link href="/" className="text-lg font-bold">AWS Blog</Link>  
        </div>  
        <div className="space-x-4">  
          <Link href="/announcement" className="text-white hover:underline">最新公告</Link>
          <Link href="/news" className="text-white hover:underline">最新新聞</Link>  
          <Link href="/knowledge" className="text-white hover:underline">知識集</Link>  
          <Link href="/other" className="text-white hover:underline">其他資源</Link>
          <Link href="/login" className="text-white hover:underline">登入</Link>  
        </div>  
      </div>  
    </nav>  
  );  
};  

export default Navbar;