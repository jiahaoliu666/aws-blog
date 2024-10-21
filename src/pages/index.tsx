// src/pages/index.tsx  
import React, { useEffect } from 'react';  
import Link from 'next/link';  
import Navbar from '../components/common/Navbar'; // 確保正確導入 Navbar  
import Footer from '../components/common/Footer'; // 引入 Footer
import '@aws-amplify/ui-react/styles.css'; // 確保樣式被正確導入

const Home: React.FC = () => {
  useEffect(() => {
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach((el) => {
      el.classList.add('opacity-0');
      setTimeout(() => {
        el.classList.add('transition-opacity', 'duration-1000', 'opacity-100');
      }, 100);
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-100 to-gray-300">
      <Navbar />
      <div className="flex flex-col items-center justify-center flex-grow px-4 py-8 fade-in">
        <h1 className="text-5xl font-extrabold text-center mb-6 text-gray-900 drop-shadow-lg">
          歡迎來到 <span className="text-blue-600">AWS Blog</span>
        </h1>
        <p className="text-xl text-center mb-6 text-gray-800 max-w-2xl leading-relaxed">
          這是一個專為 AWS 文章而設的閱讀平台。在這裡，您可以輕鬆找到、收藏和管理您的文章。
        </p>
        <Link href="/news" legacyBehavior>
          <a className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition duration-300 transform hover:scale-105 hover:bg-blue-700">
            開始閱讀文章
          </a>
        </Link>
        <div className="mt-12">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">主要功能</h2>
          <ul className="list-disc list-inside mt-4 text-gray-800 space-y-2">
            <li>輕鬆搜尋和篩選文章</li>
            <li>收藏您喜愛的內容</li>
            <li>多種顯示模式選擇</li>
            <li>淺色和深色主題切換</li>
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
