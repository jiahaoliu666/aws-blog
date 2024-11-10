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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faHistory} className="text-xl text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">近期活動</h3>
              <p className="text-sm text-gray-600">顯示最近 30 天的活動記錄</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {activityLog.length === 0 ? (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faClock} className="text-4xl text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-600">暫無活動記錄</h3>
              <p className="text-gray-500 mt-1">您的活動記錄將會顯示在這裡</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              {activityLog.map((activity, index) => (
                <div key={activity.id} className="relative pl-20 pb-8 last:pb-0">
                  <div className={`absolute left-6 w-4 h-4 rounded-full bg-white border-4 ${
                    activity.type === 'security_alert' 
                      ? 'border-yellow-500' 
                      : activity.type === 'account_delete'
                      ? 'border-red-500'
                      : 'border-blue-500'
                  }`}></div>
                  
                  <div className="bg-white p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon 
                          icon={getActivityIcon(activity.type)}
                          className={`text-xl ${getActivityColor(activity.type)}`}
                        />
                        <h3 className="text-lg font-medium text-gray-800">{activity.description}</h3>
                      </div>
                      <time className="text-sm text-gray-500">{activity.timestamp}</time>
                    </div>
                    
                    {activity.details && (
                      <p className="text-gray-600 mb-4">{activity.details}</p>
                    )}
                    
                    {activity.status && (
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                        activity.status === 'success'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : activity.status === 'warning'
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
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