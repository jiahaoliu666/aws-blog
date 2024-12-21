import React, { useEffect, useState } from 'react';
import { CgSpinner } from 'react-icons/cg';

interface NotificationProps {
  userId: string;
  notifications?: Array<{
    title: string;
    date: string;
    content: string;
    read?: boolean;
    category?: string;
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

const MAX_ARTICLES_DISPLAY = 50;

const Notification: React.FC<NotificationProps> = ({ userId, unreadCount, setUnreadCount, onNotificationClick }) => {
  const [newNotifications, setNewNotifications] = useState<NotificationProps['notifications']>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    const fetchNewArticles = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/news/notifications?userId=${userId}`,
          {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }
        );

        if (!response.ok) {
          throw new Error('獲取通知失敗');
        }

        const data = await response.json() as NotificationData;

        if (data && Array.isArray(data.articles)) {
          setNewNotifications(data.articles.map(article => ({
            title: article.translated_title,
            date: new Date(article.published_at * 1000).toLocaleDateString('zh-TW'),
            content: article.summary,
            read: article.read || false,
            category: article.category || 'news'
          })));

          const unreadArticles = data.articles.filter(article => !article.read).length;
          setUnreadCount(unreadArticles);
          setTotalCount(data.articles.length);
        }
      } catch (error) {
        console.error("獲取新文章時發生錯誤:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewArticles();
    const intervalId = setInterval(fetchNewArticles, 30000);
    return () => clearInterval(intervalId);
  }, [userId]);

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/news/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('標記已讀失敗');
      }

      setNewNotifications((prevNotifications) =>
        (prevNotifications || []).map((notification) => ({
          ...notification,
          read: true,
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("標記已讀失敗:", error);
    }
  };

  const handleClick = async () => {
    await markAllAsRead();
  };

  const handleNotificationClick = async (notification: any, index: number) => {
    if (!notification.read) {
      try {
        const response = await fetch('/api/news/notification/read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId,
            notificationId: notification.id 
          }),
        });

        if (response.ok) {
          setNewNotifications(prev => 
            prev?.map((item, i) => 
              i === index ? { ...item, read: true } : item
            )
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error('標記通知已讀失敗:', error);
      }
    }
    
    onNotificationClick?.(notification);
  };

  return (
    <div className="fixed lg:absolute right-0 top-16 lg:top-auto lg:mt-2 w-[95vw] lg:w-[32rem] max-w-md 
      mx-auto lg:mx-0 bg-white/95 shadow-2xl rounded-xl z-50 border border-gray-100/80 
      transition-all duration-300 ease-in-out backdrop-blur-md
      left-1/2 lg:left-auto transform -translate-x-1/2 lg:translate-x-0">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center 
        bg-gray-100 rounded-t-xl flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2.5 flex-wrap">
          <span className="flex items-center gap-1.5">
            通知
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs 
                bg-red-500 text-white rounded-full">{unreadCount}</span>
            )}
          </span>
          <span className="text-sm text-gray-500 font-normal">
            共 {totalCount || 0} 則
          </span>
        </h2>
        <button 
          onClick={handleClick} 
          className="text-sm text-blue-600 hover:text-blue-700 
            transition-all duration-200 px-3.5 py-1.5 rounded-full
            hover:bg-blue-50/80 border border-blue-200/80 active:scale-95"
        >
          全部已讀
        </button>
      </div>

      <div className="max-h-[75vh] lg:max-h-[40rem] overflow-y-auto scrollbar-thin 
        scrollbar-thumb-gray-300/80 scrollbar-track-gray-100/60">
        {loading ? (
          <div className="p-16 text-center text-gray-500">
            <CgSpinner className="animate-spin h-12 w-12 mx-auto mb-4" />
            <p className="text-sm">載入中...</p>
          </div>
        ) : newNotifications && newNotifications.length > 0 ? (
          newNotifications.map((notification, index) => (
            <div 
              key={index} 
              onClick={() => handleNotificationClick(notification, index)}
              className={`group flex p-4 border-b border-gray-100/75
                hover:bg-gray-50/90 transition-all duration-200 cursor-pointer
                ${notification.read 
                  ? 'bg-gray-50/40' 
                  : 'bg-white/95 hover:shadow-sm relative'}`}>
              <div className="flex items-start w-full gap-3">
                {!notification.read && (
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 
                    group-hover:scale-110 transition-transform duration-200"></span>
                )}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-500 bg-gray-50/80 px-2.5 py-0.5 rounded-full
                      border border-gray-100/80">
                      {notification.category === 'news' ? 'AWS 新聞' : '系統通知'}
                    </span>
                  </div>
                  <h3 className="text-base text-gray-900 font-medium leading-snug
                    group-hover:text-gray-800">
                    {notification.title}
                  </h3>
                  <p className="text-sm text-gray-500 flex-shrink-0">
                    {notification.date}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center text-gray-400">
            <img src="/kuku.png" alt="暫無通知" 
              className="w-32 h-32 mx-auto mb-4 opacity-75 
                transition-opacity duration-200 hover:opacity-90" />
            <p className="text-sm">目前沒有任何通知</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;