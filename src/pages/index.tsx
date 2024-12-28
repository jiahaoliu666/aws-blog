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
import { motion } from 'framer-motion';
import { fadeIn, staggerContainer, hoverCard, textVariant, cardHoverEffect, containerAnimation, gradientAnimation, smoothReveal, buttonHoverEffect } from '@/utils/animations';
import { formatTimeAgo } from '@/utils/dateUtils';

const Home: React.FC = () => {
  const { user } = useAuthContext();
  const { isDarkMode } = useTheme();
  const [isClient, setIsClient] = useState(false);
  const [latestArticles, setLatestArticles] = useState<Array<{
    article_id: string;
    title: string;
    date: number;
    category: string;
    link: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const articlesPerView = 4; // 一次顯示的文章數量

  useEffect(() => {
    setIsClient(true);
    
    // 獲取最新文章
    const fetchLatestArticles = async () => {
      try {
        setLoading(true);
        // 使用 guest 作為訪客 ID 來獲取公開文章
        const response = await fetch('/api/notifications?userId=guest&limit=6');
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.notifications)) {
            // 確保按時間排序
            const sortedArticles = data.notifications.sort((a: any, b: any) => {
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
            setLatestArticles(sortedArticles);
          }
        }
      } catch (error) {
        console.error('獲取最新文章失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestArticles();
  }, []);

  useEffect(() => {
    if (latestArticles.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentArticleIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        return nextIndex >= latestArticles.length ? 0 : nextIndex;
      });
    }, 3000); // 每3秒輪播一次

    return () => clearInterval(interval);
  }, [latestArticles]);

  // 主要功能區塊
  const features = [
    {
      icon: faNewspaper,
      title: '最新新聞',
      description: '第一時間獲取 AWS 產品更新與技術前沿資訊',
      link: '/news',
      gradient: isDarkMode 
        ? 'from-blue-600/20 via-blue-500/10 to-blue-400/20' 
        : 'from-blue-100 via-blue-50 to-blue-100',
      iconColor: 'text-blue-500',
      hoverEffect: 'hover:shadow-blue-500/20'
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
  ].map(feature => ({
    ...feature,
    gradient: feature.gradient || (isDarkMode 
      ? 'from-gray-700/40 via-gray-600/30 to-gray-700/40'
      : 'from-gray-100 via-gray-50 to-gray-100')
  }));

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
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
    }`}>
      <Navbar />
      
      {/* 優化後的 Hero Section 與最新文章整合 */}
      <motion.main 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="flex-grow"
      >
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden py-12">
          <motion.div 
            variants={gradientAnimation}
            animate="animate"
            className="absolute inset-0 opacity-10"
          />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Hero Content - 左側 */}
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="text-left"
              >
                <motion.h1 
                  variants={textVariant(0.2)}
                  className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight"
                >
                  歡迎來到 AWS Blog 365
                </motion.h1>
                
                <motion.p 
                  variants={textVariant(0.4)}
                  className={`text-lg sm:text-xl mt-6 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  快速獲取 AWS 最新資訊與技術文章
                </motion.p>

                {!user && (
                  <div className="flex gap-3 mt-8">
                    <Link href="/auth/register" className={`
                      px-6 py-3 rounded-lg text-base font-medium
                      ${isDarkMode 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-blue-500 hover:bg-blue-600'
                      }
                      text-white transition-colors
                    `}>
                      開始使用
                    </Link>
                    <Link href="/auth/login" className={`
                      px-6 py-3 rounded-lg text-base font-medium
                      ${isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-gray-100 hover:bg-gray-200'
                      }
                      transition-colors
                    `}>
                      登入
                    </Link>
                  </div>
                )}
              </motion.div>

              {/* 最新文章區塊 - 右側 */}
              <motion.div
                variants={fadeIn('left', 'spring', 0.7)}
                className={`
                  relative h-[600px] rounded-2xl p-6
                  ${isDarkMode 
                    ? 'bg-gray-800/40 backdrop-blur-sm' 
                    : 'bg-white/90 backdrop-blur-sm'
                  }
                  border border-gray-200/20
                  shadow-lg
                `}
              >
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-inherit to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-inherit to-transparent"></div>
                
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <FontAwesomeIcon icon={faNewspaper} className="text-blue-500" />
                  最新更新
                </h2>

                <div className="space-y-4 overflow-hidden h-[calc(100%-4rem)]">
                  {loading ? (
                    Array(6).fill(0).map((_, index) => (
                      <div key={index} className={`animate-pulse rounded-xl p-6 ${
                        isDarkMode 
                          ? 'bg-gray-800/60 backdrop-blur-sm' 
                          : 'bg-white/90 backdrop-blur-sm'
                      }`}>
                        <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      </div>
                    ))
                  ) : (
                    <div className="transition-transform duration-1000 ease-in-out"
                         style={{
                           transform: `translateY(-${currentArticleIndex * 100}px)`,
                         }}>
                      {latestArticles.map((article, index) => (
                        <motion.div
                          key={article.article_id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className={`
                            group rounded-xl p-6 mb-4
                            glass-morphism
                            ${isDarkMode 
                              ? 'hover:bg-gray-700/90 bg-gray-800/60' 
                              : 'hover:bg-white/95 bg-white/60'
                            }
                            transform transition-all duration-300 hover:scale-[1.02]
                            border border-gray-200/20
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                  article.category === 'news' 
                                    ? 'bg-blue-100/90 text-blue-800' 
                                    : article.category === 'solution'
                                      ? 'bg-green-100/90 text-green-800'
                                      : article.category === 'architecture'
                                        ? 'bg-amber-100/90 text-amber-800'
                                        : article.category === 'knowledge'
                                          ? 'bg-indigo-100/90 text-indigo-800'
                                          : 'bg-purple-100/90 text-purple-800'
                                }`}>
                                  {article.category === 'news' 
                                    ? '最新新聞' 
                                    : article.category === 'solution'
                                      ? '解決方案'
                                      : article.category === 'architecture'
                                        ? '架構參考'
                                        : article.category === 'knowledge'
                                          ? '知識中心'
                                          : '最新公告'}
                                </span>
                                <span className={`text-xs ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {formatTimeAgo(new Date(article.date))}
                                </span>
                              </div>
                              <a 
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-sm font-medium line-clamp-2 ${
                                  isDarkMode 
                                    ? 'text-gray-100 hover:text-blue-400' 
                                    : 'text-gray-900 hover:text-blue-600'
                                } transition-colors duration-200`}
                              >
                                {article.title}
                              </a>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section 優化 */}
        <section className={`
          py-20 relative overflow-hidden
          ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}
        `}>
          <motion.div 
            variants={containerAnimation}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={buttonHoverEffect}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                className={`
                  relative p-6 rounded-xl
                  glass-morphism gradient-border
                  ${isDarkMode 
                    ? 'hover:bg-gray-700/90' 
                    : 'hover:bg-white/95'
                  }
                `}
              >
                <Link href={feature.link} className="block h-full">
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon 
                      icon={feature.icon} 
                      className={`text-lg ${feature.iconColor}`} 
                    />
                    <div>
                      <h3 className="text-base font-medium">{feature.title}</h3>
                      <p className={`
                        text-sm mt-1
                        ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                      `}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Advantages Section 優化 */}
        <section className={`py-24 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              variants={fadeIn('up', 'spring', 0.7)}
              className="text-center space-y-16"
            >
              <div>
                <h2 className={`text-4xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  為什麼選擇此平台
                </h2>
                <div className="h-1 w-20 mx-auto mt-4 rounded-full bg-gradient-to-r from-blue-600 to-blue-400"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {advantages.map((advantage, index) => (
                  <motion.div 
                    key={advantage.title}
                    variants={fadeIn('up', 'spring', 0.7 + index * 0.1)}
                    whileHover={{ y: -8 }}
                    className={`
                      p-8 rounded-2xl
                      transition-all duration-300
                      ${isDarkMode 
                        ? 'bg-gray-800/50 hover:bg-gray-700/50' 
                        : 'bg-gray-50 hover:bg-white'
                      }
                      hover:shadow-xl
                    `}
                  >
                    <div className={`
                      w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6
                      transition-colors duration-300
                      ${isDarkMode 
                        ? 'bg-gray-700 group-hover:bg-blue-600/20' 
                        : 'bg-blue-100 group-hover:bg-blue-200'
                      }
                    `}>
                      <FontAwesomeIcon 
                        icon={advantage.icon} 
                        className={`text-3xl ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} 
                      />
                    </div>
                    <h3 className={`text-2xl font-bold mb-4
                      ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {advantage.title}
                    </h3>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {advantage.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </motion.main>

      <Footer />
    </div>
  );
};

export default Home;