import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faGrip } from '@fortawesome/free-solid-svg-icons';

interface HistoryItem {
  translatedTitle: string;
  link: string;
  timestamp: string;
  sourcePage: string;
}

interface HistorySectionProps {
  recentArticles: HistoryItem[];
}

const HistorySection: React.FC<HistorySectionProps> = ({ recentArticles }) => {
  const [isGridView, setIsGridView] = useState(true);

  return (
    <>
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">最近觀看紀錄</h1>
        <button
          onClick={() => setIsGridView(!isGridView)}
          className="p-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
          title={isGridView ? "切換列表檢視" : "切換網格檢視"}
        >
          <FontAwesomeIcon icon={isGridView ? faList : faGrip} />
        </button>
      </div>

      <div className="space-y-4">
        {recentArticles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            尚無觀看紀錄
          </div>
        ) : (
          <div className={isGridView ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            {recentArticles.map((article, index) => (
              <a 
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                key={index}
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-grow">
                  <h3 className="font-semibold hover:text-blue-600 transition-colors">
                    {article.translatedTitle}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span>來源：{article.sourcePage}</span>
                    <span>觀看時間：{new Date(article.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default HistorySection; 