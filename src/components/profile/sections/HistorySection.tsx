import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faList, 
  faGrip, 
  faInbox, 
  faClock, 
  faChevronRight 
} from '@fortawesome/free-solid-svg-icons';
import { useProfileArticles } from '@/hooks/profile/useProfileArticles';
import { useAuthContext } from '@/context/AuthContext';
import { SectionTitle } from '../common/SectionTitle';
import { Card } from '../common/Card';

interface Article {
  link: string;
  sourcePage: string;
  timeAgo: string;
  translatedTitle: string;
}

interface HistorySectionProps {
  recentArticles: Article[];
}

const HistorySection: React.FC<HistorySectionProps> = ({ recentArticles }) => {
  const { user } = useAuthContext();
  const { isLoading } = useProfileArticles({ user });
  const [isGridView, setIsGridView] = useState(false);

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionTitle 
            title="觀看紀錄"
            description="追蹤您最近閱讀的文章"
          />
          
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setIsGridView(false)}
              className={`p-2 rounded-lg transition-all ${
                !isGridView 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <FontAwesomeIcon icon={faList} className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsGridView(true)}
              className={`p-2 rounded-lg transition-all ${
                isGridView 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <FontAwesomeIcon icon={faGrip} className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <Card>
        <div className="p-4 sm:p-6">
          {recentArticles.length === 0 ? (
            <div className="text-center py-16 sm:py-32">
              <FontAwesomeIcon icon={faInbox} className="text-4xl sm:text-6xl text-gray-300 mb-4 sm:mb-6" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">尚無觀看紀錄</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                開始瀏覽文章以記錄您的閱讀歷程
              </p>
            </div>
          ) : (
            <div className={`
              ${isGridView 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' 
                : 'space-y-4'
              }
            `}>
              {recentArticles.map((article, index) => (
                <article key={index} className="group">
                  <a href={article.link} 
                    className="block p-4 sm:p-5 bg-white rounded-xl border border-gray-100 
                      shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 
                            rounded-full text-xs font-medium bg-blue-50 text-blue-600 
                            border border-blue-100">
                            {article.sourcePage}
                          </span>
                          <time className="text-xs sm:text-sm text-gray-500 flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
                            {article.timeAgo}
                          </time>
                        </div>
                        <h3 className="text-sm sm:text-base font-medium text-gray-800 
                          group-hover:text-blue-600 transition-colors duration-200 
                          line-clamp-2 sm:line-clamp-3">
                          {article.translatedTitle}
                        </h3>
                      </div>
                    </div>
                  </a>
                </article>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default HistorySection; 