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
    <div className="absolute right-0 mt-2 w-96 bg-white shadow-md rounded-md z-50 border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">通知</h2>
        <button onClick={markAllAsRead} className="text-blue-500 hover:text-blue-700">
          全部已讀
        </button>
      </div>
      {newNotifications?.slice(0, 5).map((notification, index) => (
        <div key={index} className="flex p-4 border-b border-gray-200 hover:bg-gray-50 transition duration-150">
          <div>
            <p className="text-xs text-gray-400">{notification.date}</p>
            <p className="text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: notification.content }}></p>
          </div>
        </div>
      ))}
      <div className="p-4 text-center bg-gray-100">
        <button className="text-blue-500 hover:text-blue-700">查看所有通知</button>
      </div>
    </div>
  );
};

export default Notification;
