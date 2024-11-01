import React, { useEffect, useState } from 'react';

interface NotificationProps {
  userId: string;
  notifications?: Array<{
    title: string;
    date: string;
    content: string;
    read?: boolean;
  }>;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

interface Article {
  translated_title: string;
  published_at: number;
  content: string;
  read?: boolean;
}

const MAX_ARTICLES_DISPLAY = 30;

const Notification: React.FC<NotificationProps> = ({ userId, unreadCount, setUnreadCount }) => {
  const [newNotifications, setNewNotifications] = useState<NotificationProps['notifications']>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    const fetchNewArticles = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/news/updateNews?userId=${userId}`);
        const data = await response.json();

        if (data && Array.isArray(data.articles)) {
          const sortedArticles = data.articles
            .sort((a: Article, b: Article) => b.published_at - a.published_at)
            .slice(0, MAX_ARTICLES_DISPLAY);
          setNewNotifications(sortedArticles.map((article: Article) => ({
            title: article.translated_title,
            date: article.published_at ? new Date(article.published_at * 1000).toLocaleString() : '',
            content: article.content,
            read: article.read,
          })));
          setTotalCount(data.totalCount);
        } else {
          setNewNotifications([]);
        }
      } catch (error) {
        console.error("獲取新文章時發生錯誤:", error);
        setNewNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNewArticles();
    const intervalId = setInterval(fetchNewArticles, 60000);

    return () => clearInterval(intervalId);
  }, [userId]);

  useEffect(() => {
    setUnreadCount(newNotifications?.filter(notification => !notification.read).length || 0);
  }, [newNotifications]);

  const markAllAsRead = async () => {
    // 立即更新狀態以反映所有通知已讀
    setNewNotifications((prevNotifications) =>
      (prevNotifications || []).map((notification) => ({
        ...notification,
        read: true,
      }))
    );
    setUnreadCount(0);

    try {
      const response = await fetch('/api/news/updateNews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        console.error("標記所有通知為已讀時發生錯誤: 無法更新伺服器");
      }
    } catch (error) {
      console.error("標記所有通知為已讀時發生錯誤:", error);
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-full max-w-md bg-white shadow-lg rounded-xl z-50 border border-gray-300 transition-transform transform-gpu duration-300 ease-in-out sm:w-[26rem]">
      <div className="p-4 border-b border-gray-300 flex justify-between items-center bg-gray-200 rounded-t-xl">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          通知
          {unreadCount !== undefined && (
            <span className="ml-2 text-base text-red-500">
              (共{totalCount}則，有{unreadCount}則未讀)
            </span>
          )}
        </h2>
        <button onClick={markAllAsRead} className="text-lg text-blue-600 hover:text-blue-800 transition duration-150">
          全部已讀
        </button>
      </div>
      <div className="max-h-[32rem] overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">加載中...</div>
        ) : newNotifications && newNotifications.length > 0 ? (
          newNotifications.map((notification, index) => (
            <div key={index} className={`flex p-4 border-b border-gray-300 hover:bg-gray-100 transition duration-150 cursor-pointer ${notification.read ? 'bg-gray-100' : ''}`}>
              <div className="flex items-center">
                {!notification.read && (
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                )}
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900">{notification.title}</h3>
                  <div className="text-base text-gray-900" dangerouslySetInnerHTML={{ __html: notification.content }}></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-24 text-center text-gray-500 italic">
            目前沒有任何通知
            <img src="/kuku.png" alt="哭哭圖" className="mb-6 w-32 h-32 mx-auto sm:w-48 sm:h-48" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;
