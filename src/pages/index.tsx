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
  faRocket,
  faCloud,
  faGlobe,
  faSearch,
  faStar,
  faBell
} from '@fortawesome/free-solid-svg-icons';  
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useAuthContext } from '@/context/AuthContext';  
import { useTheme } from '@/context/ThemeContext';

type ColorKey = 'blue' | 'purple' | 'yellow' | 'green' | 'indigo';

type ColorConfig = {
  [K in ColorKey]: {
    bg: string;
    hover: string;
    icon: string;
    iconBg: string;
    border: string;
  }
};

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
      link: '/news',
      color: 'blue'
    },
    {
      icon: faBullhorn,
      title: '最新公告',
      description: '重要公告與系統維護資訊',
      link: '/announcement',
      color: 'purple'
    },
    {
      icon: faLightbulb,
      title: '解決方案',
      description: '各種情境的最佳實踐與解決方案',
      link: '/solutions',
      color: 'yellow'
    },
    {
      icon: faCubes,
      title: '架構參考',
      description: '雲端架構設計範例與建議',
      link: '/architecture',
      color: 'green'
    },
    {
      icon: faBook,
      title: '知識中心',
      description: '深入了解 AWS 服務與技術',
      link: '/knowledge',
      color: 'indigo'
    }
  ] as const;

  // 平台優勢區塊
  const advantages = [
    {
      icon: faChartLine,
      title: '即時更新',
      description: '自動同步 AWS 官方最新資訊，確保內容時效性',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: faShieldAlt,
      title: '多重通知',
      description: '支援 LINE、Discord 等多種通知方式，不錯過重要更新',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: faRocket,
      title: 'AI 輔助',
      description: '文章自動總結與關鍵重點提取，提升閱讀效率',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  // 核心功能區塊
  const coreFunctions = [
    {
      icon: faSearch,
      title: '智慧搜尋',
      description: '強大的搜尋功能，快速找到所需資訊'
    },
    {
      icon: faStar,
      title: '個人收藏',
      description: '輕鬆收藏與管理感興趣的文章'
    },
    {
      icon: faBell,
      title: '即時通知',
      description: '重要更新即時推送，掌握第一手資訊'
    }
  ];

  const getFeatureColors = (color: ColorKey): ColorConfig[ColorKey] => {
    const colors: ColorConfig = {
      blue: {
        bg: isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50',
        hover: isDarkMode ? 'hover:bg-blue-900/30' : 'hover:bg-blue-100',
        icon: 'text-blue-500',
        iconBg: isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100',
        border: isDarkMode ? 'border-blue-800/30' : 'border-blue-200'
      },
      purple: {
        bg: isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50',
        hover: isDarkMode ? 'hover:bg-purple-900/30' : 'hover:bg-purple-100',
        icon: 'text-purple-500',
        iconBg: isDarkMode ? 'bg-purple-900/40' : 'bg-purple-100',
        border: isDarkMode ? 'border-purple-800/30' : 'border-purple-200'
      },
      yellow: {
        bg: isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-50',
        hover: isDarkMode ? 'hover:bg-yellow-900/30' : 'hover:bg-yellow-100',
        icon: 'text-yellow-500',
        iconBg: isDarkMode ? 'bg-yellow-900/40' : 'bg-yellow-100',
        border: isDarkMode ? 'border-yellow-800/30' : 'border-yellow-200'
      },
      green: {
        bg: isDarkMode ? 'bg-green-900/20' : 'bg-green-50',
        hover: isDarkMode ? 'hover:bg-green-900/30' : 'hover:bg-green-100',
        icon: 'text-green-500',
        iconBg: isDarkMode ? 'bg-green-900/40' : 'bg-green-100',
        border: isDarkMode ? 'border-green-800/30' : 'border-green-200'
      },
      indigo: {
        bg: isDarkMode ? 'bg-indigo-900/20' : 'bg-indigo-50',
        hover: isDarkMode ? 'hover:bg-indigo-900/30' : 'hover:bg-indigo-100',
        icon: 'text-indigo-500',
        iconBg: isDarkMode ? 'bg-indigo-900/40' : 'bg-indigo-100',
        border: isDarkMode ? 'border-indigo-800/30' : 'border-indigo-200'
      }
    };
    return colors[color];
  };

  return (
    <div className={`min-h-screen flex flex-col ${
      isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className={`absolute inset-0 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900' 
                : 'bg-gradient-to-br from-blue-50 via-white to-gray-50'
            }`} />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-8 
                bg-clip-text text-transparent bg-gradient-to-r 
                from-blue-600 to-cyan-600">
                AWS Blog 365
              </h1>
              <p className={`max-w-2xl mx-auto text-lg sm:text-xl mb-10 
                ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                一站式 AWS 技術文章閱讀平台，讓您輕鬆掌握雲端技術脈動
              </p>
              
              {!user ? (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/register" className="
                    inline-flex items-center justify-center
                    px-8 py-3 border border-transparent
                    text-base font-medium rounded-xl
                    text-white bg-gradient-to-r from-blue-600 to-cyan-600
                    hover:from-blue-700 hover:to-cyan-700
                    transition duration-300 shadow-lg hover:shadow-xl
                    transform hover:scale-105
                  ">
                    立即註冊
                  </Link>
                  <Link href="/auth/login" className={`
                    inline-flex items-center justify-center
                    px-8 py-3 border rounded-xl
                    text-base font-medium
                    ${isDarkMode 
                      ? 'border-gray-700 text-gray-300 hover:bg-gray-800' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    }
                    transition duration-300 transform hover:scale-105
                  `}>
                    登入
                  </Link>
                </div>
              ) : (
                <Link href="/news" className="
                  inline-flex items-center justify-center
                  px-8 py-3 border border-transparent
                  text-base font-medium rounded-xl
                  text-white bg-gradient-to-r from-blue-600 to-cyan-600
                  hover:from-blue-700 hover:to-cyan-700
                  transition duration-300 shadow-lg hover:shadow-xl
                  transform hover:scale-105
                ">
                  開始閱讀
                  <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Core Functions Section */}
        <div className={`py-16 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {coreFunctions.map((func, index) => (
                <div key={index} className={`
                  p-6 rounded-2xl text-center
                  ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}
                  backdrop-blur-sm border border-white/10
                  transition-all duration-300
                  hover:transform hover:-translate-y-1
                `}>
                  <div className={`
                    w-14 h-14 mx-auto rounded-xl
                    flex items-center justify-center mb-4
                    ${isDarkMode ? 'bg-gray-600' : 'bg-blue-100'}
                  `}>
                    <FontAwesomeIcon 
                      icon={func.icon} 
                      className={`text-xl ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} 
                    />
                  </div>
                  <h3 className={`text-lg font-semibold mb-2
                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {func.title}
                  </h3>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    {func.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className={`py-20 ${isDarkMode ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-md`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                主要功能
              </h2>
              <p className={`mt-4 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                多元化的內容分類，滿足您不同的學習需求
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => {
                const colors = getFeatureColors(feature.color);
                return (
                  <Link 
                    key={feature.title} 
                    href={feature.link}
                    className={`
                      group p-6 rounded-2xl transition-all duration-300
                      ${colors.bg} ${colors.hover}
                      backdrop-blur-sm border ${colors.border}
                      hover:shadow-lg hover:scale-105
                    `}
                  >
                    <div className="flex flex-col items-start">
                      <div className={`
                        p-3 rounded-xl mb-4 
                        ${colors.iconBg}
                        group-hover:scale-110 transition-transform duration-300
                      `}>
                        <FontAwesomeIcon 
                          icon={feature.icon} 
                          className={`text-xl ${colors.icon}`} 
                        />
                      </div>
                      <h3 className={`text-xl font-semibold mb-2 
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}
                        group-hover:text-blue-600 transition-colors`}>
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
                );
              })}
            </div>
          </div>
        </div>

        {/* Advantages Section */}
        <div className={`py-20 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
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
                    relative p-8 rounded-2xl text-center
                    overflow-hidden group
                    transition-all duration-300 
                    hover:transform hover:-translate-y-1
                    ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'}
                    backdrop-blur-sm border border-white/10
                  `}
                >
                  {/* Gradient Background */}
                  <div className={`
                    absolute inset-0 opacity-10 bg-gradient-to-br ${advantage.gradient}
                    group-hover:opacity-15 transition-opacity duration-300
                  `} />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className={`
                      w-16 h-16 mx-auto rounded-2xl 
                      flex items-center justify-center mb-6
                      bg-gradient-to-br ${advantage.gradient}
                      group-hover:scale-110 transition-transform duration-300
                    `}>
                      <FontAwesomeIcon 
                        icon={advantage.icon} 
                        className="text-2xl text-white" 
                      />
                    </div>
                    <h3 className={`text-xl font-semibold mb-4
                      ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {advantage.title}
                    </h3>
                    <p className={`
                      ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                      leading-relaxed
                    `}>
                      {advantage.description}
                    </p>
                  </div>
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