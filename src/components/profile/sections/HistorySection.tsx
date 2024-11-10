import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faGrip, faHistory, faInbox, faGlobe, faClock } from '@fortawesome/free-solid-svg-icons';
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
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <FontAwesomeIcon icon={faInbox} className="text-5xl text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-700">尚無觀看紀錄</h3>
          <p className="text-gray-500 mt-2">開始瀏覽文章以記錄您的閱讀歷程</p>
        </div>
      ) : (
        <div className={isGridView ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {recentArticles.map((article, index) => (
            <a 
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              key={index}
              className={`group block transition-all duration-200 bg-white hover:bg-gray-50 rounded-xl p-5 hover:shadow-md`}
            >
              <div className="flex flex-col h-full">
                <h3 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 text-lg">
                  {article.translatedTitle}
                </h3>
                <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faGlobe} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="group-hover:text-gray-700 transition-colors">{article.sourcePage}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faClock} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="group-hover:text-gray-700 transition-colors">{new Date(article.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistorySection; 