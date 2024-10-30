import React, { useEffect, useState } from 'react';

interface NotificationProps {
  notifications?: Array<{
    title: string;
    date: string;
    content: string;
    read?: boolean;
  }>;
}

const Notification: React.FC<NotificationProps> = () => {
  const [newNotifications, setNewNotifications] = useState<NotificationProps['notifications']>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchNewArticles = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/news/updateNews');
        const data = await response.json();
        setNewNotifications(data);
      } catch (error) {
        console.error("獲取新文章時發生錯誤:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewArticles();
    const intervalId = setInterval(fetchNewArticles, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const markAllAsRead = () => {
    console.log("所有通知已標記為已讀");
    setNewNotifications((prevNotifications) =>
      (prevNotifications || []).map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white shadow-lg rounded-xl z-50 border border-gray-300 transition-transform transform-gpu duration-300 ease-in-out">
      <div className="p-4 border-b border-gray-300 flex justify-between items-center bg-gray-200 rounded-t-xl">
        <h2 className="text-lg font-semibold text-gray-900">通知</h2>
        <button onClick={markAllAsRead} className="text-blue-600 hover:text-blue-800 transition duration-150">
          全部已讀
        </button>
      </div>
      {loading ? (
        <div className="p-4 text-center text-gray-500">加載中...</div>
      ) : (
        newNotifications?.slice(0, 5).map((notification, index) => (
          <div key={index} className={`flex p-4 border-b border-gray-300 hover:bg-gray-100 transition duration-150 cursor-pointer ${notification.read ? 'bg-gray-100' : ''}`}>
            <div>
              <p className="text-xs text-gray-500">{notification.date}</p>
              <h3 className="text-sm font-bold text-gray-900">{notification.title}</h3>
              <div className="text-sm text-gray-900" dangerouslySetInnerHTML={{ __html: notification.content }}></div>
            </div>
          </div>
        ))
      )}
      <div className="p-4 text-center bg-gray-200 rounded-b-xl">
        <button className="text-blue-600 hover:text-blue-800 transition duration-150">查看所有通知</button>
      </div>
    </div>
  );
};

export default Notification;
