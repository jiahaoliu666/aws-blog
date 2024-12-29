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
      icon: faNewspaper,
      title: '最新新聞',
      description: '即時更新 AWS 新功能與服務資訊',
      link: '/news',
      className: `
        relative rounded-xl p-8
        transition-all duration-300
        hover:shadow-2xl
        bg-white/90 hover:bg-white/95
        transition-all duration-300
      `
    },
    {
      icon: faBullhorn,
      title: '最新公告',
      description: '重要公告與系統維護通知',
      link: '/announcement',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      className: `
        relative rounded-xl p-8
        transition-all duration-300
        hover:shadow-2xl
        bg-white/90 hover:bg-white/95
        transition-all duration-300
      `
    },
    {
      icon: faLightbulb,
      title: '解決方案',
      description: '各種情境的最佳實踐與解決方案',
      link: '/solutions',
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
      className: `
        relative rounded-xl p-8
        transition-all duration-300
        hover:shadow-2xl
        bg-white/90 hover:bg-white/95
        transition-all duration-300
      `
    },
    {
      icon: faCubes,
      title: '架構參考',
      description: '雲端架構設計範例與建議',
      link: '/architecture',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      className: `
        relative rounded-xl p-8
        transition-all duration-300
        hover:shadow-2xl
        bg-white/90 hover:bg-white/95
        transition-all duration-300
      `
    },
    {
      icon: faBook,
      title: '知識中心',
      description: '深入了解 AWS 服務與技術',
      link: '/knowledge',
      color: 'text-rose-500',
      bgColor: 'bg-rose-50',
      className: `
        relative rounded-xl p-8
        transition-all duration-300
        hover:shadow-2xl
        bg-white/90 hover:bg-white/95
        transition-all duration-300
      `
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
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <Navbar />
      
      <motion.main 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="flex-grow"
      >
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden py-16 bg-gradient-to-br from-gray-50 to-blue-50">
          <motion.div 
            variants={gradientAnimation}
            animate="animate"
            className="absolute inset-0 bg-grid-pattern opacity-5"
          />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Hero Content - 左側 */}
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="text-left space-y-8"
              >
                <motion.h1 
                  variants={textVariant(0.2)}
                  className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600"
                >
                  歡迎來到 AWS Blog 365
                </motion.h1>
                
                <motion.p 
                  variants={textVariant(0.4)}
                  className="text-lg sm:text-xl text-gray-600 leading-relaxed"
                >
                  在這裡，您可以輕鬆獲取 AWS 最新資訊與技術文章，讓學習更有效率。
                </motion.p>

                <div className="flex gap-4 mt-8">
                  <Link 
                    href="/news" 
                    className="px-8 py-4 rounded-xl text-base font-medium
                      bg-blue-600 hover:bg-blue-700
                      text-white transition-all duration-300
                      shadow-lg hover:shadow-blue-200/50
                      transform hover:-translate-y-0.5"
                  >
                    開始使用
                  </Link>
                </div>
              </motion.div>

              {/* 最新文章區塊 - 右側 */}
              <motion.div
                variants={fadeIn('left', 'spring', 0.7)}
                className="relative h-[600px] rounded-2xl p-8
                  bg-white/80 backdrop-blur-sm
                  shadow-xl hover:shadow-2xl
                  transition-all duration-500
                  border border-gray-100"
              >
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-inherit to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-inherit to-transparent"></div>
                
                <h2 className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400 text-4xl font-bold mb-6">
                  最新文章
                </h2>

                <div className="space-y-4 overflow-hidden h-[calc(100%-4rem)]">
                  {loading ? (
                    Array(6).fill(0).map((_, index) => (
                      <div key={index} className="animate-pulse rounded-xl p-6 bg-white/90 backdrop-blur-sm">
                        <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      </div>
                    ))
                  ) : (
                    <div className="transition-transform duration-1000 ease-in-out"
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
                          className="group rounded-xl p-6 mb-4
                            bg-white/50 backdrop-blur-sm
                            transform transition-all duration-300
                            hover:bg-white hover:scale-[1.02]
                            hover:shadow-lg hover:-translate-y-1
                            border border-gray-100/50 hover:border-gray-200
                            cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium 
                                  transition-colors duration-300
                                  group-hover:shadow-sm ${
                                  article.category === 'news' 
                                    ? 'bg-blue-100/90 text-blue-800 group-hover:bg-blue-200' 
                                    : article.category === 'solution'
                                      ? 'bg-green-100/90 text-green-800 group-hover:bg-green-200'
                                      : article.category === 'architecture'
                                        ? 'bg-amber-100/90 text-amber-800 group-hover:bg-amber-200'
                                        : article.category === 'knowledge'
                                          ? 'bg-indigo-100/90 text-indigo-800 group-hover:bg-indigo-200'
                                          : 'bg-purple-100/90 text-purple-800 group-hover:bg-purple-200'
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
                                className="text-sm font-medium line-clamp-2 
                                  text-gray-900 group-hover:text-blue-600 
                                  transition-colors duration-300"
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
        <section className="py-24 bg-gradient-to-br from-white to-gray-50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                文章分類
              </h2>
              <div className="h-1 w-24 mx-auto mt-6 rounded-full bg-gradient-to-r from-blue-600 to-blue-400"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={buttonHoverEffect}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  className="relative rounded-2xl p-8
                    bg-white
                    transition-all duration-300
                    shadow-lg hover:shadow-xl
                    border border-gray-100
                    transform hover:-translate-y-1"
                >
                  <Link href={feature.link} className="block h-full">
                    <div className="space-y-4">
                      <div className={`
                        w-12 h-12 rounded-lg 
                        flex items-center justify-center
                        ${feature.color} 
                        bg-white
                      `}>
                        <FontAwesomeIcon 
                          icon={feature.icon} 
                          className="text-xl"
                        />
                      </div>
                      
                      <div>
                        <h3 className={`
                          text-lg font-semibold
                          text-gray-900
                        `}>
                          {feature.title}
                        </h3>
                        <p className={`
                          mt-2 text-sm
                          text-gray-600
                        `}>
                          {feature.description}
                        </p>
                      </div>
                      
                      <div className={`
                        text-sm font-medium
                        ${feature.color}
                        flex items-center gap-1
                      `}>
                        了解更多
                        <FontAwesomeIcon 
                          icon={faArrowRight} 
                          className="text-xs"
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
        <section className="py-32 bg-gradient-to-br from-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              variants={fadeIn('up', 'spring', 0.7)}
              className="text-center space-y-20"
            >
              <div>
                <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                  為什麼選擇此平台
                </h2>
                <div className="h-1 w-24 mx-auto mt-6 rounded-full bg-gradient-to-r from-blue-600 to-blue-400"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {advantages.map((advantage, index) => (
                  <motion.div 
                    key={advantage.title}
                    variants={enhancedCardHover}
                    initial="rest"
                    whileHover="hover"
                    className="p-10 rounded-2xl
                      bg-white
                      transition-all duration-300
                      shadow-lg hover:shadow-xl
                      border border-gray-100
                      transform hover:-translate-y-2"
                  >
                    <div className={`
                      w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6
                      transition-colors duration-300
                      bg-blue-100 group-hover:bg-blue-200"
                    `}>
                      <FontAwesomeIcon 
                        icon={advantage.icon} 
                        className="text-3xl text-blue-600"
                      />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-900">
                      {advantage.title}
                    </h3>
                    <p className="text-lg text-gray-600">
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