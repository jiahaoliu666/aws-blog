import React, { useEffect, useState } from 'react';
import { CgSpinner } from 'react-icons/cg';
import { formatTimeAgo } from '@/utils/dateUtils';
import { FaNewspaper, FaBullhorn, FaLightbulb, FaCubes, FaBook, FaList, FaEllipsisV } from 'react-icons/fa';

interface NotificationProps {
  userId: string;
  notifications?: Array<{
    article_id: string;
    title: string;
    date: string;
    content: string;
    read?: boolean;
    category?: string;
    link?: string;
  }>;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  onNotificationClick?: (notification: any) => void;
}

interface Article {
  article_id: string;
  title: string;
  translated_title: string;
  published_at: number;
  info: string;
  description: string;
  translated_description: string;
  link: string;
  summary: string;
  read?: boolean;
  category?: string;
}

interface NotificationData {
  articles: Article[];
}

interface NotificationItem {
  article_id: string;
  title: string;
  date: number;
  content: string;
  read: boolean;
  category: string;
  link: string;
}

const MAX_ARTICLES_DISPLAY = 50;

const categoryConfig = {
  all: { icon: FaList, label: '全部文章' },
  announcement: { icon: FaBullhorn, label: '最新公告' },
  news: { icon: FaNewspaper, label: '最新新聞' },
  solution: { icon: FaLightbulb, label: '解決方案' },
  architecture: { icon: FaCubes, label: '架構參考' },
  knowledge: { icon: FaBook, label: '知識中心' }
};

const Notification: React.FC<NotificationProps> = ({ userId, unreadCount, setUnreadCount, onNotificationClick }) => {
  const [newNotifications, setNewNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<boolean>(false);

  useEffect(() => {
    const fetchNewArticles = async () => {
      console.log('開始獲取通知數據...');
      console.log('用戶ID:', userId);
      setLoading(true);
      
      try {
        console.log('發送請求到:', `/api/notifications?userId=${userId}`);
        const response = await fetch(
          `/api/notifications?userId=${userId}`,
          {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }
        );

        console.log('API響應狀態:', response.status);
        if (!response.ok) {
          throw new Error(`獲取通知失敗: ${response.status}`);
        }

        const data = await response.json();
        console.log('獲取到的數據:', data);
        
        if (data && Array.isArray(data.notifications)) {
          console.log('通知數量:', data.notifications.length);
          const sortedNotifications = data.notifications.sort((a: NotificationItem, b: NotificationItem) => {
            const dateA = typeof a.date === 'string' ? parseInt(a.date) : a.date;
            const dateB = typeof b.date === 'string' ? parseInt(b.date) : b.date;
            return dateB - dateA;
          });
          setNewNotifications(sortedNotifications);
          const unreadCount = sortedNotifications.filter(
            (notification: NotificationItem) => !notification.read
          ).length;
          console.log('未讀通知數:', unreadCount);
          setUnreadCount(unreadCount);
          setTotalCount(sortedNotifications.length);
        }
      } catch (error) {
        console.error("獲取通知時發生錯誤:", error);
        console.error("錯誤詳情:", {
          name: (error as Error).name,
          message: (error as Error).message,
          stack: (error as Error).stack
        });
      } finally {
        setLoading(false);
      }
    };

    console.log('初始化通知組件...');
    fetchNewArticles();
    const intervalId = setInterval(fetchNewArticles, 30000);
    return () => clearInterval(intervalId);
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showMenu && !target.closest('.relative')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  const handleItemClick = (notification: NotificationItem) => {
    onNotificationClick?.(notification);
  };

  const handleLinkClick = async (e: React.MouseEvent, notification: NotificationItem) => {
    e.stopPropagation();

    if (!notification.read) {
      try {
        const response = await fetch(
          '/api/notifications/mark-read',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              userId,
              articleId: notification.article_id
            }),
          }
        );

        if (response.ok) {
          setNewNotifications(prev => 
            prev.map(item => 
              item.article_id === notification.article_id 
                ? { ...item, read: true } 
                : item
            )
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error('標記通知已讀失敗:', error);
      }
    }
  };

  const getDisplayTime = (timestamp: number | string) => {
    try {
      const numericTimestamp = typeof timestamp === 'string' 
        ? parseInt(timestamp) 
        : timestamp;
      
      const millisecondTimestamp = numericTimestamp * (numericTimestamp < 1e12 ? 1000 : 1);
      const date = new Date(millisecondTimestamp);

      if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.warn('無效的日期格式:', timestamp);
        return '未知時間';
      }
      
      return formatTimeAgo(date);
    } catch (error) {
      console.error('時間顯示錯誤:', error, '時間戳:', timestamp);
      return '未知時間';
    }
  };

  const handleClick = async () => {
    try {
      const response = await fetch(
        '/api/notifications/mark-read',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (response.ok) {
        setNewNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("標記全部已讀失敗:", error);
    }
  };

  // 根據選擇的分類過濾通知
  const filteredNotifications = newNotifications.filter(notification => 
    selectedCategory === 'all' || !selectedCategory ? true : notification.category === selectedCategory
  );

  return (
    <div className="fixed lg:absolute right-0 top-16 lg:top-auto lg:mt-2 w-[95vw] lg:w-[32rem] max-w-md 
      mx-auto lg:mx-0 bg-white shadow-xl rounded-xl z-50 border border-gray-200 
      transition-all duration-300 ease-in-out backdrop-blur-md
      left-1/2 lg:left-auto transform -translate-x-1/2 lg:translate-x-0">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center 
        bg-gradient-to-b from-gray-50 to-white rounded-t-xl flex-wrap gap-2
        sticky top-0 backdrop-blur-sm z-10">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <span className="flex items-center gap-2">
            通知中心
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs 
                bg-blue-600 text-white rounded-full font-medium">{unreadCount}</span>
            )}
          </span>
          <span className="text-sm font-normal text-gray-500">
            · 共 {totalCount || 0} 則
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleClick} 
            className="text-sm text-gray-700 hover:text-gray-900 
              transition-all duration-200 px-3.5 py-1.5 rounded-lg
              hover:bg-gray-100 active:scale-95 font-medium"
          >
            全部標為已讀
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 
                hover:text-gray-900 transition-all duration-200"
            >
              <FaEllipsisV className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg 
                border border-gray-200 py-1 z-50">
                {Object.entries(categoryConfig).map(([key, { icon: Icon, label }]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedCategory(key);
                      setShowMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm
                      ${selectedCategory === key 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-h-[75vh] lg:max-h-[40rem] overflow-y-auto scrollbar-thin 
        scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-500 scrollbar-track-transparent
        divide-y divide-gray-200">
        {loading ? (
          <div className="p-16 text-center text-gray-500 bg-gray-50">
            <CgSpinner className="animate-spin h-10 w-10 mx-auto mb-4 text-blue-600" />
            <p className="text-sm font-medium">正在載入通知...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification, index) => (
            <div 
              key={notification.article_id} 
              onClick={() => handleItemClick(notification)}
              className={`group relative flex px-4 py-4 
                hover:bg-gray-50 transition-all duration-200
                ${notification.read ? 'bg-transparent' : 'bg-blue-50'}`}
            >
              <div className="flex items-start w-full gap-3">
                {!notification.read && (
                  <span className="shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 
                    group-hover:scale-110 transition-transform duration-200"></span>
                )}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                      transition-colors duration-200
                      ${notification.category === 'news' 
                        ? 'bg-blue-100 text-blue-800 group-hover:bg-blue-200' 
                        : notification.category === 'solution'
                          ? 'bg-green-100 text-green-800 group-hover:bg-green-200'
                          : notification.category === 'architecture'
                            ? 'bg-amber-100 text-amber-800 group-hover:bg-amber-200'
                            : notification.category === 'knowledge'
                              ? 'bg-indigo-100 text-indigo-800 group-hover:bg-indigo-200'
                              : 'bg-purple-100 text-purple-800 group-hover:bg-purple-200'}`}>
                      {notification.category === 'news' 
                        ? '最新新聞' 
                        : notification.category === 'solution'
                          ? '解決方案'
                          : notification.category === 'architecture'
                            ? '架構參考'
                            : notification.category === 'knowledge'
                              ? '知識中心'
                              : '最新公告'}
                    </span>
                    <span className="text-xs text-gray-500 group-hover:text-gray-600">
                      {getDisplayTime(notification.date)}
                    </span>
                  </div>
                  <h3 className="text-sm text-gray-900 font-medium leading-relaxed
                    group-hover:text-black">
                    <a 
                      href={notification.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 hover:underline decoration-blue-400/50 
                        decoration-1 underline-offset-2 transition-colors duration-200"
                      onClick={(e) => handleLinkClick(e, notification)}
                    >
                      {notification.title}
                    </a>
                  </h3>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center text-gray-500 bg-gray-50">
            <img src="/kuku.png" alt="暫無通知" 
              className="w-28 h-28 mx-auto mb-4 opacity-75 
                transition-opacity duration-200 hover:opacity-90 select-none" />
            <p className="text-sm font-medium">
              {selectedCategory ? '該分類下暫無通知' : '目前沒有任何通知'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {selectedCategory ? '請選擇其他分類查看' : '有新通知時會立即顯示'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;