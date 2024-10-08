import React from 'react';  
import Link from 'next/link';  

const Home: React.FC = () => {  
  return (  
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200">  
      <h1 className="text-4xl font-bold text-center mb-6 text-gray-800">歡迎來到 AWS Blog</h1>  
      <p className="text-lg text-center mb-4 text-gray-700">  
        這是一個專為AWS文章而設的閱讀平台。在這裡，您可以輕鬆找到、收藏和管理您的文章。  
      </p>  
      <Link href="/news" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200">  
        開始閱讀文章  
      </Link>  
      <div className="mt-8">  
        <h2 className="text-2xl font-semibold text-gray-800">主要功能</h2>  
        <ul className="list-disc list-inside mt-4 text-gray-700">  
          <li>輕鬆搜尋和篩選文章</li>  
          <li>收藏您喜愛的內容</li>  
          <li>多種顯示模式選擇</li>  
          <li>淺色和深色主題切換</li>  
        </ul>  
      </div>  
    </div>  
  );  
};  

export default Home;