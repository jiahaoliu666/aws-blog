import React, { useEffect, useState } from 'react';
import { CgSpinner } from 'react-icons/cg';

interface NotificationProps {
  userId: string;
  notifications?: Array<{
    title: string;
    date: string;
    content: string;
    read?: boolean;
    source?: string;
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
  source?: string;
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
            source: article.source
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
    <div className="fixed lg:absolute right-0 top-16 lg:top-auto lg:mt-2 w-[95vw] lg:w-[26rem] max-w-md 
      mx-auto lg:mx-0 bg-white shadow-lg rounded-xl z-50 border border-gray-300 
      transition-all duration-300 ease-in-out
      left-1/2 lg:left-auto transform -translate-x-1/2 lg:translate-x-0">
      <div className="p-3 lg:p-4 border-b border-gray-300 flex justify-between items-center 
        bg-gray-200 rounded-t-xl flex-wrap gap-2">
        <h2 className="text-base lg:text-xl font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
          通知
          {unreadCount !== undefined && (
            <span className="text-sm lg:text-base text-red-500 whitespace-nowrap">
              (共{totalCount || 0}則，有{unreadCount}則未讀)
            </span>
          )}
        </h2>
        <button 
          onClick={handleClick} 
          className="text-sm lg:text-base text-blue-600 hover:text-blue-800 
            transition duration-150 whitespace-nowrap px-2 py-1 rounded
            hover:bg-blue-50"
        >
          全部已讀
        </button>
      </div>
      <div className="max-h-[60vh] lg:max-h-[32rem] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <CgSpinner className="animate-spin h-8 w-8 mx-auto mb-2" />
            <p>正在載入通知...</p>
          </div>
        ) : newNotifications && newNotifications.length > 0 ? (
          newNotifications.map((notification, index) => (
            <div 
              key={index} 
              onClick={() => handleNotificationClick(notification, index)}
              className={`flex p-3 lg:p-4 border-b border-gray-300 
                hover:bg-gray-100 transition-all duration-300 ease-in-out cursor-pointer
                transform hover:scale-[1.01] hover:shadow-sm
                ${notification.read ? 'bg-gray-50' : 'bg-white'}`}>
              <div className="flex items-center w-full gap-2">
                {!notification.read && (
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full my-auto"></span>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm lg:text-base text-gray-900 break-words">
                    {notification.title}
                  </h3>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs lg:text-sm text-gray-500">
                      {notification.date}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-500">
                      {notification.source || '系統通知'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 lg:py-24 text-center text-gray-500 italic">
            目前沒有任何通知
            <img src="/kuku.png" alt="哭哭圖" 
              className="mt-4 w-24 h-24 lg:w-32 lg:h-32 mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;