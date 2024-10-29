import React from 'react';

interface NotificationProps {
  notifications: Array<{
    title: string;
    date: string;
    content: string;
  }>;
}

const Notification: React.FC<NotificationProps> = ({ notifications }) => {
  const markAllAsRead = () => {
    console.log("所有通知已標記為已讀");
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white shadow-lg rounded-lg z-50">
      <div className="p-4 border-b border-gray-300 flex justify-between items-center">
        <h2 className="text-lg font-bold text-black">通知</h2>
        <button onClick={markAllAsRead} className="text-blue-500 hover:underline">
          全部已讀
        </button>
      </div>
      {notifications.map((notification, index) => (
        <div key={index} className="flex p-4 border-b border-gray-300">
          <div>
            <h3 className="text-md font-semibold text-black">{notification.title}</h3>
            <p className="text-sm text-gray-500">{notification.date}</p>
            <p className="text-sm text-gray-700">{notification.content}</p>
          </div>
        </div>
      ))}
      <div className="p-4 text-center">
        <button className="text-blue-500 hover:underline">查看所有通知</button>
      </div>
    </div>
  );
};

export default Notification;
