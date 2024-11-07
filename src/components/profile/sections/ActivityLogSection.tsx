import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser,
  faSignInAlt,
  faEdit,
  faTrash,
  faClock,
  faExclamationTriangle
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
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 border-b pb-4">活動日誌</h1>

      <div className="space-y-6">
        {activityLog.length === 0 ? (
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faClock} className="text-4xl text-gray-400 mb-4" />
            <p className="text-gray-500">暫無活動記錄</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {activityLog.map((activity, index) => (
              <div key={activity.id} className="relative pl-20 pb-8">
                <div className="absolute left-6 w-4 h-4 rounded-full bg-white border-4 border-blue-500"></div>
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <FontAwesomeIcon 
                        icon={getActivityIcon(activity.type)}
                        className={`text-xl mr-3 ${getActivityColor(activity.type)}`}
                      />
                      <h3 className="text-lg font-semibold">{activity.description}</h3>
                    </div>
                    <span className="text-sm text-gray-500">{activity.timestamp}</span>
                  </div>
                  
                  {activity.details && (
                    <p className="text-gray-600 mb-4">{activity.details}</p>
                  )}
                  
                  {activity.status && (
                    <div className={`inline-block px-3 py-1 rounded-full text-sm ${
                      activity.status === 'success'
                        ? 'bg-green-100 text-green-800'
                        : activity.status === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {activity.status}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogSection; 