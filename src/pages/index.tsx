// src/pages/index.tsx  
import React, { useEffect, useState } from 'react';  
import Link from 'next/link';  
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';  
import { 
  faNewspaper,
  faBullhorn,
  faLightbulb,
  faCubes,
  faBook,
  faArrowRight,
  faChartLine,
  faShieldAlt,
  faRocket
} from '@fortawesome/free-solid-svg-icons';  
import Navbar from '../components/common/Navbar'; // 確保正確導入 Navbar  
import Footer from '../components/common/Footer'; // 引入 Footer  
import { useAuthContext } from '@/context/AuthContext';  
import { useTheme } from '@/context/ThemeContext';

const Home: React.FC = () => {
  const { user } = useAuthContext();
  const { isDarkMode } = useTheme();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 主要功能區塊
  const features = [
    {
      icon: faNewspaper,
      title: '最新新聞',
      description: '即時掌握 AWS 最新動態與產品更新',
      link: '/news'
    },
    {
      icon: faBullhorn,
      title: '最新公告',
      description: '重要公告與系統維護資訊',
      link: '/announcement'
    },
    {
      icon: faLightbulb,
      title: '解決方案',
      description: '各種情境的最佳實踐與解決方案',
      link: '/solutions'
    },
    {
      icon: faCubes,
      title: '架構參考',
      description: '雲端架構設計範例與建議',
      link: '/architecture'
    },
    {
      icon: faBook,
      title: '知識中心',
      description: '深入了解 AWS 服務與技術',
      link: '/knowledge'
    }
  ];

  // 平台優勢區塊
  const advantages = [
    {
      icon: faChartLine,
      title: '即時更新',
      description: '自動同步 AWS 官方最新資訊'
    },
    {
      icon: faShieldAlt,
      title: '多重通知',
      description: '支援 LINE、Discord 等多種通知方式'
    },
    {
      icon: faRocket,
      title: 'AI 輔助',
      description: '文章自動總結與關鍵重點提取'
    }
  ];

  return (
    <div className={`min-h-screen flex flex-col ${
      isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      <Navbar />
      
      {/* Hero Section */}
      <main className="flex-grow">
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-8">
                <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  歡迎來到 
                </span>
                <span className="text-blue-600 ml-2">
                  AWS Blog 365
                </span>
              </h1>
              <p className={`max-w-2xl mx-auto text-lg sm:text-xl mb-10 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                一站式 AWS 技術文章閱讀平台，讓您輕鬆掌握雲端技術脈動
              </p>
              
              {!user && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/register" className="
                    inline-flex items-center justify-center
                    px-6 py-3 border border-transparent
                    text-base font-medium rounded-xl
                    text-white bg-blue-600 hover:bg-blue-700
                    transition duration-300 shadow-lg hover:shadow-xl
                  ">
                    立即註冊
                  </Link>
                  <Link href="/auth/login" className={`
                    inline-flex items-center justify-center
                    px-6 py-3 border rounded-xl
                    text-base font-medium
                    ${isDarkMode 
                      ? 'border-gray-700 text-gray-300 hover:bg-gray-800' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    }
                    transition duration-300
                  `}>
                    登入
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className={`py-16 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                主要功能
              </h2>
              <p className={`mt-4 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                多元化的內容分類，滿足您不同的學習需求
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                <Link 
                  key={feature.title} 
                  href={feature.link}
                  className={`
                    group p-6 rounded-2xl transition-all duration-300
                    ${isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-gray-50 hover:bg-blue-50'
                    }
                  `}
                >
                  <div className="flex flex-col items-start">
                    <div className={`
                      p-3 rounded-xl mb-4
                      ${isDarkMode ? 'bg-gray-600' : 'bg-blue-100'}
                    `}>
                      <FontAwesomeIcon 
                        icon={feature.icon} 
                        className={`text-xl ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} 
                      />
                    </div>
                    <h3 className={`text-xl font-semibold mb-2 group-hover:text-blue-600 
                      ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {feature.title}
                    </h3>
                    <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {feature.description}
                    </p>
                    <div className="mt-auto flex items-center text-blue-600 font-medium">
                      <span>了解更多</span>
                      <FontAwesomeIcon 
                        icon={faArrowRight} 
                        className="ml-2 group-hover:translate-x-1 transition-transform" 
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Advantages Section */}
        <div className={`py-16 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                平台優勢
              </h2>
              <p className={`mt-4 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                為什麼選擇 AWS Blog 365
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {advantages.map((advantage) => (
                <div 
                  key={advantage.title}
                  className={`
                    p-6 rounded-2xl text-center
                    ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
                    transition-all duration-300 hover:transform hover:-translate-y-1
                  `}
                >
                  <div className={`
                    w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4
                    ${isDarkMode ? 'bg-gray-700' : 'bg-blue-100'}
                  `}>
                    <FontAwesomeIcon 
                      icon={advantage.icon} 
                      className={`text-2xl ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} 
                    />
                  </div>
                  <h3 className={`text-xl font-semibold mb-2 
                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {advantage.title}
                  </h3>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    {advantage.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;