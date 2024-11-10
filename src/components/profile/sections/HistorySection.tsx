import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faGrip, faHistory, faInbox, faGlobe, faClock, faNewspaper, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useProfileArticles } from '@/hooks/profile/useProfileArticles';
import { useAuthContext } from '@/context/AuthContext';

const HistorySection: React.FC = () => {
  const { user } = useAuthContext();
  const { recentArticles, isLoading } = useProfileArticles({ user });
  const [isGridView, setIsGridView] = useState(true);

  return (
    <div className="w-full">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">觀看紀錄</h1>
          <p className="mt-2 text-gray-600">追蹤您最近閱讀的文章</p>
        </div>
        
        <button
          onClick={() => setIsGridView(!isGridView)}
          className="px-4 py-2.5 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-all duration-200 flex items-center gap-2"
          title={isGridView ? "切換列表檢視" : "切換網格檢視"}
        >
          <FontAwesomeIcon icon={isGridView ? faList : faGrip} className="text-lg" />
          <span className="text-sm font-medium">{isGridView ? "列表檢視" : "網格檢視"}</span>
        </button>
      </div>

      {recentArticles.length === 0 ? (
        <div className="text-center py-36 bg-white rounded-3xl border border-gray-200 
          shadow-md backdrop-blur-sm bg-white/50
          bg-gradient-to-b from-white via-gray-50/50 to-gray-100/30">
          <FontAwesomeIcon icon={faInbox} className="text-8xl text-gray-300 mb-8 
            transform motion-safe:hover:scale-110 transition-all duration-500" />
          <h3 className="text-2xl font-semibold text-gray-800">尚無觀看紀錄</h3>
          <p className="text-gray-500 mt-4 max-w-md mx-auto leading-relaxed">
            開始瀏覽文章以記錄您的閱讀歷程
          </p>
        </div>
      ) : (
        <div className={isGridView 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          : "space-y-5"
        }>
          {recentArticles.map((article, index) => (
            <article 
              key={index}
              className="group relative bg-white rounded-2xl overflow-hidden
              border border-gray-200/60 shadow-sm backdrop-blur-sm
              transition-all duration-300 ease-out
              hover:shadow-lg hover:border-blue-200/80
              hover:translate-y-[-2px]"
            >
              <a href={article.link} className="block">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 
                  opacity-0 group-hover:opacity-100 transition-all duration-300" />

                <div className="p-5 sm:p-6">
                  <div className="flex gap-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                          bg-blue-50/80 text-blue-600 border border-blue-100/80
                          group-hover:bg-blue-100 group-hover:border-blue-200/80 
                          transition-all duration-300">
                          {article.sourcePage}
                        </span>
                        <time className="text-sm text-gray-400 flex items-center gap-2">
                          <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
                          {article.timeAgo}
                        </time>
                      </div>

                      <h3 className="text-base font-medium text-gray-800 group-hover:text-blue-600 
                        transition-colors duration-300 leading-relaxed line-clamp-2">
                        {article.translatedTitle}
                      </h3>
                    </div>

                    <div className="hidden sm:flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-50/80 flex items-center justify-center
                        group-hover:bg-blue-50 group-hover:scale-105
                        transition-all duration-300">
                        <FontAwesomeIcon 
                          icon={faChevronRight} 
                          className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500 
                          group-hover:translate-x-0.5 transition-all duration-300" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistorySection; 