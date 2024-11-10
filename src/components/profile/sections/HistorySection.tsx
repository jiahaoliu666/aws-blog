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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">觀看紀錄</h1>
        <p className="mt-2 text-gray-600">追蹤您最近閱讀的文章</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faHistory} className="text-xl text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">最近觀看</h3>
                <p className="text-sm text-gray-600">共 {recentArticles.length} 篇文章</p>
              </div>
            </div>
            <button
              onClick={() => setIsGridView(!isGridView)}
              className="p-2.5 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
              title={isGridView ? "切換列表檢視" : "切換網格檢視"}
            >
              <FontAwesomeIcon icon={isGridView ? faList : faGrip} className="text-lg" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {recentArticles.length === 0 ? (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faInbox} className="text-4xl text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-600">尚無觀看紀錄</h3>
              <p className="text-gray-500 mt-1">開始瀏覽文章以記錄您的閱讀歷程</p>
            </div>
          ) : (
            <div className={isGridView ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
              {recentArticles.map((article, index) => (
                <a 
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={index}
                  className={`block transition-all ${
                    isGridView 
                      ? 'bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-4'
                      : 'bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-4'
                  }`}
                >
                  <div className="flex flex-col h-full">
                    <h3 className="font-medium text-gray-800 hover:text-blue-600 transition-colors line-clamp-2">
                      {article.translatedTitle}
                    </h3>
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faGlobe} className="text-gray-400" />
                        <span>{article.sourcePage}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                        <span>{new Date(article.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistorySection; 