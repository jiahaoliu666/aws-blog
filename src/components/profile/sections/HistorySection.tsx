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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <SectionTitle 
            title="觀看紀錄"
            description="追蹤您最近閱讀的文章"
          />
          
          <div className="flex items-center gap-3 self-end sm:self-auto bg-gray-50 p-1.5 rounded-lg">
            <button
              onClick={() => setIsGridView(false)}
              className={`px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 ${
                !isGridView 
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-100' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FontAwesomeIcon icon={faList} className="w-4 h-4" />
              <span className="text-sm font-medium">列表</span>
            </button>
            <button
              onClick={() => setIsGridView(true)}
              className={`px-4 py-2 rounded-md transition-all duration-200 flex items-center gap-2 ${
                isGridView 
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-100' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FontAwesomeIcon icon={faGrip} className="w-4 h-4" />
              <span className="text-sm font-medium">網格</span>
            </button>
          </div>
        </div>
      </div>

      <Card>
        <div className="p-6">
          {recentArticles.length === 0 ? (
            <div className="text-center py-32 bg-gray-50/50 rounded-xl">
              <FontAwesomeIcon icon={faInbox} className="text-6xl text-gray-300 mb-6" />
              <h3 className="text-xl font-semibold text-gray-800 mb-3">尚無觀看紀錄</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                開始瀏覽文章以記錄您的閱讀歷程
              </p>
            </div>
          ) : (
            <div className={`
              ${isGridView 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-4'
              }
            `}>
              {recentArticles.map((article, index) => (
                <article key={index} className="group relative">
                  <a href={article.link} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block bg-white rounded-xl border-2 border-gray-200 
                      transition-all duration-300 hover:shadow-xl hover:border-blue-300
                      ${isGridView ? 'p-4 h-[160px] flex flex-col justify-center' : 'p-7'} shadow-md hover:-translate-y-0.5`}
                  >
                    <div className={`flex gap-3 ${isGridView ? 'flex-1 justify-center' : ''}`}>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className={`flex flex-wrap gap-2 mb-2 ${isGridView ? 'items-start' : 'sm:items-center sm:flex-row'}`}>
                          <span className={`inline-flex items-center px-3 py-1 
                            rounded-full text-xs font-medium tracking-wide
                            ${article.sourcePage === '最新新聞' 
                              ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/50' 
                              : article.sourcePage === '解決方案'
                                ? 'bg-green-50 text-green-700 ring-1 ring-green-200/50'
                                : article.sourcePage === '架構參考'
                                  ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50'
                                  : article.sourcePage === '知識中心'
                                    ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/50'
                                    : 'bg-purple-50 text-purple-700 ring-1 ring-purple-200/50'
                            }`}>
                            {article.sourcePage}
                          </span>
                          <time className="text-sm text-gray-500 flex items-center gap-2">
                            <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5" />
                            {article.timeAgo}
                          </time>
                        </div>
                        <h3 className="text-base font-medium text-gray-800 
                          group-hover:text-blue-600 transition-colors duration-200 
                          line-clamp-2 leading-relaxed">
                          {article.translatedTitle}
                        </h3>
                      </div>
                      <div className="flex items-center text-gray-300 group-hover:text-blue-400 transition-colors duration-200">
                        <FontAwesomeIcon icon={faChevronRight} className="w-5 h-5" />
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