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
  faTimesCircle,
  faShieldAlt
} from '@fortawesome/free-solid-svg-icons';
import { formatTimeAgo } from '@/utils/dateUtils';
import { SectionContainer } from '../common/SectionContainer';
import { Card } from '../common/Card';
import { commonStyles as styles } from '../common/styles';
import { SectionTitle } from '../common/SectionTitle';

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

  const getDisplayTime = (activity: ActivityLog) => {
    try {
      const date = activity.parsedDate;
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return activity.timestamp;
      }
      return formatTimeAgo(date);
    } catch (error) {
      console.error('時間顯示錯誤:', error);
      return activity.timestamp;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <SectionTitle 
          title="活動日誌"
          description="追蹤您的帳戶活動記錄"
        />
      </div>

      <Card>
        <div className="p-6">
          {activityLog.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <FontAwesomeIcon 
                icon={faClock} 
                className="text-6xl text-gray-300 mb-4" 
              />
              <h3 className="text-xl font-semibold text-gray-700 mb-3">暫無活動記錄</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                所有帳戶活動都會即時記錄並顯示在這裡
              </p>
            </div>
          ) : (
            <div className="relative space-y-6">
              {activityLog.map((activity) => (
                <div key={activity.id} className="relative pl-32 group">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2">
                    <time className="text-xs font-medium text-gray-600 
                      flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full
                      border border-gray-200 group-hover:border-gray-300 
                      transition-all duration-200 shadow-sm">
                      <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5" />
                      <span>{getDisplayTime(activity)}</span>
                    </time>
                  </div>

                  <div className={`absolute left-[6.5rem] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full 
                    bg-white border-2 z-10 transition-all duration-200
                    ${activity.type === 'security_alert' 
                      ? 'border-yellow-500 ring-4 ring-yellow-50' 
                      : activity.type === 'account_delete'
                      ? 'border-red-500 ring-4 ring-red-50'
                      : 'border-blue-500 ring-4 ring-blue-50'
                    }`}>
                  </div>

                  <div className="absolute left-[7rem] top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="bg-white p-5 rounded-xl border border-gray-200 
                    transition-all duration-200 hover:border-gray-300 hover:shadow-md">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border
                        transition-colors ${getActivityColor(activity.type).replace('text-', 'border-')}
                        ${getActivityColor(activity.type).replace('text-', 'bg-').replace('500', '50')}`}>
                        <FontAwesomeIcon 
                          icon={getActivityIcon(activity.type)}
                          className={`text-lg ${getActivityColor(activity.type)}`}
                        />
                      </div>
                      <h3 className="text-sm font-medium text-gray-800">
                        {activity.description}
                      </h3>
                    </div>
                    
                    {activity.details && (
                      <p className="text-sm text-gray-600 ml-14 leading-relaxed">
                        {activity.details}
                      </p>
                    )}
                    
                    {activity.status && (
                      <div className="ml-14 mt-3">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                          border transition-colors
                          ${activity.status === 'success'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : activity.status === 'warning'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
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
      </Card>
    </div>
  );
};

export default ActivityLogSection; 