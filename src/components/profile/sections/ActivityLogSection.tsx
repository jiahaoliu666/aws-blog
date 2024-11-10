import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser,
  faSignInAlt,
  faEdit,
  faTrash,
  faClock,
  faExclamationTriangle,
  faHistory,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { formatTimeAgo } from '@/utils/dateUtils';

interface ActivityLog {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  parsedDate: Date;
  details?: string;
  status?: string;
}

interface ActivityLogSectionProps {
  activityLog: ActivityLog[];
}

const ActivityLogSection: React.FC<ActivityLogSectionProps> = ({ activityLog }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return faSignInAlt;
      case 'profile_update':
        return faEdit;
      case 'account_delete':
        return faTrash;
      case 'security_alert':
        return faExclamationTriangle;
      default:
        return faUser;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'login':
        return 'text-green-500';
      case 'profile_update':
        return 'text-blue-500';
      case 'account_delete':
        return 'text-red-500';
      case 'security_alert':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">活動日誌</h1>
          <p className="mt-2 text-gray-600">追蹤您的帳戶活動記錄</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="p-4">
          {activityLog.length === 0 ? (
            <div className="text-center py-20 bg-gradient-to-b from-white via-gray-50/30 to-gray-100/20 rounded-xl">
              <FontAwesomeIcon 
                icon={faClock} 
                className="text-6xl text-gray-200 mb-4 transform motion-safe:hover:scale-110 transition-all duration-500 hover:text-gray-300" 
              />
              <h3 className="text-xl font-semibold text-gray-700">暫無活動記錄</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                您的帳戶活動將會即時顯示在這裡
              </p>
            </div>
          ) : (
            <div className="relative">
              {activityLog.map((activity) => (
                <div key={activity.id} className="relative pl-24 pb-6 last:pb-0 group">
                  <time className="absolute left-0 top-0 text-xs text-gray-400 
                    flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-full min-w-[4.5rem] justify-center
                    group-hover:bg-gray-100 transition-colors duration-300"
                    title={activity.timestamp}>
                    <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
                    <span className="whitespace-nowrap">{formatTimeAgo(activity.parsedDate)}</span>
                  </time>

                  <div className={`absolute left-[5.25rem] top-0 w-3 h-3 rounded-full 
                    bg-white border-2 shadow-sm z-10
                    ${activity.type === 'security_alert' 
                      ? 'border-yellow-400 ring-2 ring-yellow-50' 
                      : activity.type === 'account_delete'
                      ? 'border-red-400 ring-2 ring-red-50'
                      : 'border-blue-400 ring-2 ring-blue-50'
                    } transition-all duration-300`}>
                  </div>

                  <div className="absolute left-[5.85rem] top-0 bottom-0 w-0.5 bg-gray-100"></div>
                  
                  <div className="bg-white p-4 rounded-xl border border-gray-100 
                    hover:shadow-md hover:border-blue-100 hover:-translate-y-0.5
                    transition-all duration-300 ease-in-out">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                          ${getActivityColor(activity.type).replace('text-', 'bg-').replace('500', '50')}
                          shadow-sm transition-transform duration-300 hover:scale-110`}>
                          <FontAwesomeIcon 
                            icon={getActivityIcon(activity.type)}
                            className={`text-base ${getActivityColor(activity.type)}`}
                          />
                        </div>
                        <h3 className="text-base font-medium text-gray-700 hover:text-gray-900 transition-colors duration-300">
                          {activity.description}
                        </h3>
                      </div>
                    </div>
                    
                    {activity.details && (
                      <p className="text-sm text-gray-600 ml-11 leading-relaxed">
                        {activity.details}
                      </p>
                    )}
                    
                    {activity.status && (
                      <div className="ml-11 mt-2">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                          ${activity.status === 'success'
                            ? 'bg-green-50 text-green-600 border border-green-100'
                            : activity.status === 'warning'
                            ? 'bg-yellow-50 text-yellow-600 border border-yellow-100'
                            : 'bg-red-50 text-red-600 border border-red-100'
                          } transition-all duration-300 hover:shadow-sm`}>
                          <FontAwesomeIcon 
                            icon={
                              activity.status === 'success' 
                                ? faCheckCircle 
                                : activity.status === 'warning'
                                ? faExclamationTriangle
                                : faTimesCircle
                            } 
                            className="text-xs"
                          />
                          <span>{activity.status}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogSection; 