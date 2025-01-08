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
import Navbar from '../components/common/Navbar';  
import Footer from '../components/common/Footer'; 
import { useAuthContext } from '@/context/AuthContext';  
import { motion } from 'framer-motion';
import { fadeIn, staggerContainer, hoverCard, textVariant, cardHoverEffect, containerAnimation, gradientAnimation, smoothReveal, buttonHoverEffect, enhancedCardHover } from '@/utils/animations';
import { formatTimeAgo } from '@/utils/dateUtils';

const Home: React.FC = () => {
  const { user } = useAuthContext();
  const [isClient, setIsClient] = useState(false);
  const [latestArticles, setLatestArticles] = useState<Array<{
    article_id: string;
    title: string;
    date: number;
    category: string;
    link: string;
    summary: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
  const articlesPerView = 4; // 一次顯示的文章數量
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // 獲取最新文章
    const fetchLatestArticles = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/latest-articles');
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.articles)) {
            setLatestArticles(data.articles);
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
    if (latestArticles.length === 0 || isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentArticleIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        return nextIndex >= latestArticles.length ? 0 : nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [latestArticles, isPaused]);

  // 主要功能區塊
  const features = [
    {
      icon: faBullhorn,
      title: '最新公告',
      description: '重要公告與服務更新通知',
      link: '/announcement',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      className: `
        group p-8 sm:p-10 rounded-2xl
        bg-white
        transition-all duration-300
        shadow-[0_4px_20px_rgb(0,0,0,0.05)]
        hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]
        border border-gray-100
        transform hover:-translate-y-1
      `
    },
    {
      icon: faNewspaper,
      title: '最新新聞',
      description: '即時更新 AWS 新功能與服務資訊',
      link: '/news',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      className: `
        group p-8 sm:p-10 rounded-2xl
        bg-white
        transition-all duration-300
        shadow-[0_4px_20px_rgb(0,0,0,0.05)]
        hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]
        border border-gray-100
        transform hover:-translate-y-1
      `
    },
    {
      icon: faLightbulb,
      title: '解決方案',
      description: '各種情境的最佳實踐與解決方案',
      link: '/solutions',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      className: `
        group p-8 sm:p-10 rounded-2xl
        bg-white
        transition-all duration-300
        shadow-[0_4px_20px_rgb(0,0,0,0.05)]
        hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]
        border border-gray-100
        transform hover:-translate-y-1
      `
    },
    {
      icon: faCubes,
      title: '架構參考',
      description: '雲端架構設計範例與建議',
      link: '/architecture',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      className: `
        group p-8 sm:p-10 rounded-2xl
        bg-white
        transition-all duration-300
        shadow-[0_4px_20px_rgb(0,0,0,0.05)]
        hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]
        border border-gray-100
        transform hover:-translate-y-1
      `
    },
    {
      icon: faBook,
      title: '知識中心',
      description: '深入了解 AWS 服務與技術',
      link: '/knowledge',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      className: `
        group p-8 sm:p-10 rounded-2xl
        bg-white
        transition-all duration-300
        shadow-[0_4px_20px_rgb(0,0,0,0.05)]
        hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]
        border border-gray-100
        transform hover:-translate-y-1
      `
    }
  ];

  // 平台優勢區塊
  const advantages = [
    {
      icon: faChartLine,
      title: '即時更新',
      description: '自動同步 AWS 官方資訊，第一時間掌握最新動態與更新資訊'
    },
    {
      icon: faShieldAlt,
      title: '即時通知',
      description: '支援電子郵件、LINE、Discord 等，讓您重要資訊不漏接'
    },
    {
      icon: faRocket,
      title: 'AI 輔助',
      description: '透過 AI 智能摘要文章重點，快速理解內容、節省您寶貴時間'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />
      
      <motion.main 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="flex-grow"
      >
        {/* Hero Section - 優化應式設計 */}
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden py-12 sm:py-16 md:py-20 bg-gradient-to-br from-white to-blue-50">
          <motion.div 
            variants={gradientAnimation}
            animate="animate"
            className="absolute inset-0 bg-grid-pattern opacity-[0.03]"
          />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
              {/* Hero Content - 左側 */}
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="text-left space-y-6 sm:space-y-8 px-4 sm:px-0"
              >
                <motion.h1 
                  variants={textVariant(0.2)}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold 
                    leading-[1.4] sm:leading-[1.4] md:leading-[1.3] lg:leading-[1.3]
                    tracking-tight
                    py-2 my-1
                    bg-clip-text text-transparent bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500
                    min-h-[1.5em]
                    flex items-center"
                >
                  <span className="block">歡迎來到 AWS Blog 365</span>
                </motion.h1>
                
                <motion.p 
                  variants={textVariant(0.4)}
                  className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl mt-4"
                >
                  在這裡，透過一站式平台輕鬆獲取 AWS 最新資訊與技術文章，幫助您更快掌握雲端核心知識！
                </motion.p>

                <div className="flex gap-4 mt-8">
                  <Link 
                    href="/news" 
                    className="group relative px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base md:text-lg font-medium
                      bg-gradient-to-r from-blue-600 to-blue-500 
                      text-white
                      transition-all duration-300
                      hover:shadow-lg hover:shadow-blue-200/50
                      hover:-translate-y-0.5
                      active:translate-y-0.5
                      overflow-hidden
                      w-full sm:w-auto text-center"
                  >
                    <span className="relative z-10">開始使用</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-600 
                      transition-opacity duration-300 opacity-0 group-hover:opacity-100"></div>
                  </Link>
                </div>
              </motion.div>

              {/* 最新文章區塊 - 右側 */}
              <motion.div
                variants={fadeIn('left', 'spring', 0.7)}
                className="relative h-[400px] sm:h-[500px] md:h-[600px] rounded-[16px] p-4 sm:p-6
                  bg-gradient-to-br from-white to-blue-50/30
                  shadow-[0_8px_32px_rgba(0,0,0,0.08)]
                  hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)]
                  transition-all duration-500 ease-in-out
                  border border-gray-100/50
                  mx-2 sm:mx-4 my-6 sm:my-8
                  backdrop-blur-xl
                  hover:scale-[1.02]
                  transform-gpu"
              >
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/95 to-transparent z-10 rounded-t-[16px]"></div>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/95 to-transparent z-10 rounded-b-[16px]"></div>
                
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
                  最新文章
                </h2>
                
                <div className="w-full h-[1px] bg-gray-200 mb-4"></div>

                <div className="space-y-3 overflow-hidden h-[calc(100%-6rem)]">
                  {loading ? (
                    Array(6).fill(0).map((_, index) => (
                      <div key={index} className="animate-pulse rounded-xl p-3 sm:p-5 bg-white/90 backdrop-blur-sm">
                        <div className="h-3 bg-gray-200 rounded w-1/4 mb-3"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))
                  ) : (
                    <div className="transition-transform duration-1000 ease-in-out space-y-3 sm:space-y-4"
                         style={{
                           transform: `translateY(-${currentArticleIndex * 100}px)`,
                         }}
                         onMouseEnter={() => setIsPaused(true)}
                         onMouseLeave={() => setIsPaused(false)}
                    >
                      {latestArticles.map((article, index) => (
                        <motion.div
                          key={article.article_id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="group rounded-xl p-3 sm:p-5
                            bg-white backdrop-blur-sm
                            transform transition-all duration-300
                            hover:bg-white/95 hover:scale-[1.02]
                            shadow-sm hover:shadow-lg
                            border-2 border-gray-200 hover:border-blue-200
                            cursor-pointer"
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className={`text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg font-medium 
                                  transition-colors duration-300
                                  ${
                                  article.category === 'news' 
                                    ? 'bg-blue-50 text-blue-700 group-hover:bg-blue-100' 
                                    : article.category === 'solution'
                                      ? 'bg-green-50 text-green-700 group-hover:bg-green-100'
                                      : article.category === 'architecture'
                                        ? 'bg-amber-50 text-amber-700 group-hover:bg-amber-100'
                                        : article.category === 'knowledge'
                                          ? 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100'
                                          : 'bg-purple-50 text-purple-700 group-hover:bg-purple-100'
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
                                <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors duration-300">
                                  {formatTimeAgo(new Date(
                                    typeof article.date === 'string' 
                                      ? parseInt(article.date) * (parseInt(article.date) < 1e12 ? 1000 : 1)
                                      : article.date * (article.date < 1e12 ? 1000 : 1)
                                  ))}
                                </span>
                              </div>
                              <a 
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs sm:text-sm font-medium line-clamp-2 
                                  text-gray-900 group-hover:text-blue-600 
                                  transition-colors duration-300
                                  hover:underline decoration-blue-600 decoration-2"
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

        {/* Features Section */}
        <section className="py-16 sm:py-24 md:py-32 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <motion.h2 
                variants={fadeIn('up', 'spring', 0.5)}
                className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-blue-600"
              >
                文章分類
              </motion.h2>
              <motion.div 
                variants={fadeIn('up', 'spring', 0.7)}
                className="h-1 w-16 sm:w-24 mx-auto mt-4 sm:mt-6 rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={fadeIn('up', 'spring', 0.5 + index * 0.1)}
                  className={`${feature.className} p-6 sm:p-8`}
                >
                  <Link href={feature.link} className="block h-full">
                    <div className="space-y-3 sm:space-y-4">
                      <div className={`
                        w-10 h-10 sm:w-12 sm:h-12 rounded-xl
                        flex items-center justify-center
                        ${feature.color}
                        ${feature.bgColor}
                        transition-all duration-300
                        group-hover:scale-110
                      `}>
                        <FontAwesomeIcon 
                          icon={feature.icon} 
                          className="text-lg sm:text-xl transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                      
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                          {feature.title}
                        </h3>
                        <p className="mt-2 text-sm sm:text-base text-gray-600 group-hover:text-gray-900 transition-colors duration-300">
                          {feature.description}
                        </p>
                      </div>
                      
                      <div className={`
                        text-sm font-medium
                        ${feature.color}
                        flex items-center gap-1.5
                        transition-all duration-300
                        group-hover:gap-2.5
                      `}>
                        了解更多
                        <FontAwesomeIcon 
                          icon={faArrowRight} 
                          className="text-xs transition-all duration-300 group-hover:translate-x-1"
                        />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Advantages Section */}
        <section className="py-16 sm:py-24 md:py-32 bg-gradient-to-br from-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              variants={fadeIn('up', 'spring', 0.7)}
              className="text-center space-y-12 sm:space-y-16 md:space-y-20"
            >
              <div>
                <motion.h2 
                  variants={fadeIn('up', 'spring', 0.5)}
                  className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-blue-600"
                >
                  為什麼選擇此平台
                </motion.h2>
                <motion.div 
                  variants={fadeIn('up', 'spring', 0.7)}
                  className="h-1 w-16 sm:w-24 mx-auto mt-4 sm:mt-6 rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
                {advantages.map((advantage, index) => (
                  <motion.div 
                    key={advantage.title}
                    variants={enhancedCardHover}
                    initial="rest"
                    whileHover="hover"
                    className="group p-6 sm:p-8 md:p-10 rounded-2xl
                      bg-white
                      transition-all duration-300
                      shadow-[0_4px_20px_rgb(0,0,0,0.05)]
                      hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]
                      border border-gray-100
                      transform hover:-translate-y-1"
                  >
                    <div className={`
                      w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto rounded-xl
                      flex items-center justify-center mb-4 sm:mb-6
                      transition-all duration-300
                      bg-gradient-to-br from-blue-50 to-blue-100
                      group-hover:scale-110
                      group-hover:shadow-md
                    `}>
                      <FontAwesomeIcon 
                        icon={advantage.icon} 
                        className="text-xl sm:text-2xl text-blue-600 transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900 text-center group-hover:text-blue-600 transition-colors duration-300">
                      {advantage.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 text-center group-hover:text-gray-900 transition-colors duration-300">
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