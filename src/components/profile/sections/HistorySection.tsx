import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faGrip, faHistory, faInbox, faGlobe, faClock, faNewspaper, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useProfileArticles } from '@/hooks/profile/useProfileArticles';
import { useAuthContext } from '@/context/AuthContext';

const HistorySection: React.FC = () => {
  const { user } = useAuthContext();
  const { recentArticles, isLoading } = useProfileArticles({ user });
  const [isGridView, setIsGridView] = useState(true);

  if (isLoading) {
    return <div>載入中...</div>;
  }

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
        <div className="text-center py-20 bg-gray-50/50 rounded-2xl border border-gray-100 backdrop-blur-sm">
          <FontAwesomeIcon icon={faInbox} className="text-6xl text-gray-300 mb-5" />
          <h3 className="text-xl font-semibold text-gray-700">尚無觀看紀錄</h3>
          <p className="text-gray-500 mt-3 max-w-md mx-auto">開始瀏覽文章以記錄您的閱讀歷程</p>
        </div>
      ) : (
        <div className={isGridView ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-5"}>
          {recentArticles.map((article, index) => (
            <article 
              key={index}
              className="group relative bg-white rounded-xl overflow-hidden
              border border-gray-100/80 backdrop-blur-sm
              transition-all duration-300 
              hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]
              hover:border-gray-200
              hover:translate-y-[-2px]"
            >
              <a 
                href={article.link} 
                className="block"
              >
                {/* 頂部裝飾條 */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 
                  group-hover:opacity-100 transition-opacity duration-300" />

                <div className="p-5 sm:p-6">
                  {/* 主要內容區 */}
                  <div className="flex gap-6">
                    {/* 右側內容區 */}
                    <div className="flex-1 min-w-0">
                      {/* 標籤和時間 */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                          bg-blue-50 text-blue-600 border border-blue-100
                          group-hover:bg-blue-100 group-hover:border-blue-200 transition-colors">
                          {article.sourcePage}
                        </span>
                        <time 
                          className="text-sm text-gray-500 flex items-center gap-1.5"
                        >
                          <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5" />
                          {article.timeAgo}
                        </time>
                      </div>

                      {/* 標題 */}
                      <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 
                        transition-colors leading-relaxed tracking-tight mb-2.5">
                        {article.translatedTitle}
                      </h3>


                    </div>
                    {/* 右側箭頭 */}
                    <div className="hidden sm:flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center
                        group-hover:bg-blue-50 group-hover:shadow-sm transition-all duration-300">
                        <FontAwesomeIcon 
                          icon={faChevronRight} 
                          className="h-4 w-4 text-gray-400 group-hover:text-blue-500 
                          group-hover:transform group-hover:translate-x-0.5 transition-all" 
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