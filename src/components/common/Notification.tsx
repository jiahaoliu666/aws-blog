import React, { useEffect, useState } from 'react';

interface NotificationProps {
  notifications?: Array<{
    title: string;
    date: string;
    content: string;
  }>;
}

const Notification: React.FC<NotificationProps> = () => {
  const [newNotifications, setNewNotifications] = useState<NotificationProps['notifications']>([]);

  useEffect(() => {
    const fetchNewArticles = async () => {
      try {
        const response = await fetch('/api/news/updateNews');
        const data = await response.json();
        setNewNotifications(data);
      } catch (error) {
        console.error("獲取新文章時發生錯誤:", error);
      }
    };

    fetchNewArticles();
    const intervalId = setInterval(fetchNewArticles, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const markAllAsRead = () => {
    console.log("所有通知已標記為已讀");
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white shadow-lg rounded-lg z-50 border border-gray-300">
      <div className="p-4 border-b border-gray-300 flex justify-between items-center bg-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">通知</h2>
        <button onClick={markAllAsRead} className="text-blue-600 hover:text-blue-800 transition duration-150">
          全部已讀
        </button>
      </div>
      {newNotifications?.slice(0, 5).map((notification, index) => (
        <div key={index} className="flex p-4 border-b border-gray-300 hover:bg-gray-100 transition duration-150">
          <div>
            <p className="text-xs text-gray-500">{notification.date}</p>
            <p className="text-sm text-gray-900" dangerouslySetInnerHTML={{ __html: notification.content }}></p>
          </div>
        </div>
      ))}
      <div className="p-4 text-center bg-gray-200">
        <button className="text-blue-600 hover:text-blue-800 transition duration-150">查看所有通知</button>
      </div>
    </div>
  );
};

export default Notification;
