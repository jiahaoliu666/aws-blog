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

interface ActivityLog {
  id: string;
  type: string;
  description: string;
  timestamp: string;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">活動日誌</h1>
        <p className="mt-2 text-gray-600">追蹤您的帳戶活動記錄</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-300/80 shadow-sm backdrop-blur-sm">
        <div className="p-6">
          {activityLog.length === 0 ? (
            <div className="text-center py-36 bg-gradient-to-b from-white via-gray-50/50 to-gray-100/30">
              <FontAwesomeIcon 
                icon={faClock} 
                className="text-8xl text-gray-300 mb-8 transform motion-safe:hover:scale-110 transition-all duration-500" 
              />
              <h3 className="text-2xl font-semibold text-gray-800">暫無活動記錄</h3>
              <p className="text-gray-500 mt-4 max-w-md mx-auto leading-relaxed">
                您的活動記錄將會顯示在這裡
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200/80"></div>
              
              {activityLog.map((activity, index) => (
                <div key={activity.id} className="relative pl-20 pb-8 last:pb-0">
                  <div className={`absolute left-6 w-4 h-4 rounded-full bg-white border-4 
                    ${activity.type === 'security_alert' 
                      ? 'border-yellow-500' 
                      : activity.type === 'account_delete'
                      ? 'border-red-500'
                      : 'border-blue-500'
                    } transition-colors duration-300`}>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl border border-gray-200/80 
                    hover:shadow-md hover:border-blue-200/80 hover:translate-y-[-2px]
                    transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center
                          ${getActivityColor(activity.type).replace('text-', 'bg-').replace('500', '50')}`}>
                          <FontAwesomeIcon 
                            icon={getActivityIcon(activity.type)}
                            className={`text-lg ${getActivityColor(activity.type)}`}
                          />
                        </div>
                        <h3 className="text-lg font-medium text-gray-800">{activity.description}</h3>
                      </div>
                      <time className="text-sm text-gray-400 flex items-center gap-2">
                        <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
                        {activity.timestamp}
                      </time>
                    </div>
                    
                    {activity.details && (
                      <p className="text-gray-600 ml-11">{activity.details}</p>
                    )}
                    
                    {activity.status && (
                      <div className="ml-11 mt-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm
                          ${activity.status === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : activity.status === 'warning'
                            ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                          } transition-colors duration-300`}>
                          <FontAwesomeIcon 
                            icon={
                              activity.status === 'success' 
                                ? faCheckCircle 
                                : activity.status === 'warning'
                                ? faExclamationTriangle
                                : faTimesCircle
                            } 
                            className="text-sm"
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