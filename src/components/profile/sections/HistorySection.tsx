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
      <div className="mb-8">
        <SectionTitle 
          title="觀看紀錄"
          description="追蹤您最近閱讀的文章"
        />
      </div>

      <Card>
        <div className="p-6">
          {recentArticles.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-xl border border-gray-100">
              <FontAwesomeIcon icon={faInbox} className="text-6xl text-gray-300 mb-6" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">尚無觀看紀錄</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                開始瀏覽文章以記錄您的閱讀歷程
              </p>
            </div>
          ) : (
            <div className={isGridView 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              : "space-y-4"
            }>
              {recentArticles.map((article, index) => (
                <article 
                  key={index}
                  className="group bg-white rounded-xl border border-gray-100 shadow-sm
                    transition-all duration-200 hover:border-gray-200 hover:shadow-md"
                >
                  <a href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block p-5"
                  >
                    <div className="flex gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                            bg-blue-50 text-blue-600 border border-blue-100">
                            {article.sourcePage}
                          </span>
                          <time className="text-sm text-gray-500 flex items-center gap-2">
                            <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
                            {article.timeAgo}
                          </time>
                        </div>

                        <h3 className="text-base font-medium text-gray-800 group-hover:text-blue-600 
                          transition-colors duration-200 line-clamp-2">
                          {article.translatedTitle}
                        </h3>
                      </div>

                      <div className="hidden sm:flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center
                          group-hover:bg-blue-50 transition-all duration-200">
                          <FontAwesomeIcon 
                            icon={faChevronRight} 
                            className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500" 
                          />
                        </div>
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