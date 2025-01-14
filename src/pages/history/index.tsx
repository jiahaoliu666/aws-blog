import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHistory,
  faCodeBranch,
  faCode,
  faBug,
  faRocket,
  faFeather,
  faShieldAlt,
  faWrench
} from '@fortawesome/free-solid-svg-icons';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import BaseCard from '@/components/common/BaseCard';

interface VersionHistory {
  version: string;
  date: string;
  type: 'feature' | 'fix' | 'improvement' | 'security';
  title: string;
  description: string[];
}

const versionHistory: VersionHistory[] = [
  {
    version: '1.0.0',
    date: '2025-01-10',
    type: 'feature',
    title: '初始版本發布',
    description: [
      '【網站架構】建立基礎網站結構',
      '【用戶認證】註冊、登入、忘記密碼功能',
      '【文章分類】最新公告、最新新聞、解決方案、架構參考、知識中心',
      '【收藏文章】實現跨類別收藏功能，支援收藏列表管理與快速檢索分類',
      '【個人化設定】個人資料編輯、密碼修改、偏好設定（語言、通知等）',
      '【電子郵件整合】實現電子郵件驗證、訂閱服務與即時推送功能',
      '【LINE整合】支援LINE驗證、訂閱服務與即時推送功能',
      '【Discord整合】實現OAuth授權登入與Bot互動功能（通知推送）',
      '【多語言支援】提供繁體中文/英文即時切換功能',
      '【活動日誌】記錄用戶瀏覽與操作行為，支援日誌檢索與過濾',
      '【意見反饋】意見反饋提交表單介面',
      '【自動更新】文章自動更新機制',
      '【搜尋功能】提供高效全文檢索與多條件篩選',
      '【快取機制】文章快取機制，提升網站效能',
      '【AWS服務整合】整合Cognito身份驗證、S3儲存、DynamoDB資料庫等',
    ]
  }
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'feature':
      return faRocket;
    case 'fix':
      return faBug;
    case 'improvement':
      return faFeather;
    case 'security':
      return faShieldAlt;
    default:
      return faWrench;
  }
};

const getTypeStyles = (type: string) => {
  switch (type) {
    case 'feature':
      return {
        bg: 'bg-blue-50/80',
        text: 'text-blue-700',
        border: 'border-blue-200',
        iconBg: 'bg-blue-100',
        label: '新功能',
        timeline: 'bg-blue-200'
      };
    case 'fix':
      return {
        bg: 'bg-red-50/80',
        text: 'text-red-700',
        border: 'border-red-200',
        iconBg: 'bg-red-100',
        label: '錯誤修復',
        timeline: 'bg-red-200'
      };
    case 'improvement':
      return {
        bg: 'bg-green-50/80',
        text: 'text-green-700',
        border: 'border-green-200',
        iconBg: 'bg-green-100',
        label: '效能優化',
        timeline: 'bg-green-200'
      };
    case 'security':
      return {
        bg: 'bg-yellow-50/80',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        iconBg: 'bg-yellow-100',
        label: '安全性更新',
        timeline: 'bg-yellow-200'
      };
    default:
      return {
        bg: 'bg-gray-50/80',
        text: 'text-gray-700',
        border: 'border-gray-200',
        iconBg: 'bg-gray-100',
        label: '其他更新',
        timeline: 'bg-gray-200'
      };
  }
};

const HistoryPage = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* 頁面標題 */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 rounded-2xl bg-white shadow-lg shadow-blue-100 transform hover:scale-105 transition-transform duration-200">
                <FontAwesomeIcon 
                  icon={faHistory} 
                  className="text-3xl text-blue-500" 
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  版本歷史
                </h1>
                <p className="text-base text-gray-600">
                  追蹤系統更新與改進記錄
                </p>
              </div>
            </div>
          </div>

          {/* 版本時間軸 */}
          <div className="relative space-y-10 mb-8">
            {versionHistory.map((version, index) => {
              const typeStyles = getTypeStyles(version.type);
              
              return (
                <div key={version.version} className="relative">
                  {/* 連接線 */}
                  {index !== versionHistory.length - 1 && (
                    <div className={`absolute left-6 top-16 bottom-0 w-1 ${typeStyles.timeline} rounded-full opacity-50`} />
                  )}
                  
                  <BaseCard className="relative bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full ${typeStyles.timeline}`} />
                    <div className="p-8">
                      {/* 版本資訊 */}
                      <div className="flex items-start gap-6">
                        <div className={`
                          w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0
                          ${typeStyles.iconBg} ${typeStyles.text}
                          transform hover:scale-110 transition-transform duration-200
                          shadow-inner
                        `}>
                          <FontAwesomeIcon icon={getTypeIcon(version.type)} className="text-2xl" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-4 flex-wrap mb-3">
                            <h2 className="text-xl font-bold text-gray-900">
                              版本 {version.version}
                            </h2>
                            <span className={`
                              px-4 py-1.5 rounded-full text-sm font-semibold
                              ${typeStyles.bg} ${typeStyles.text} ${typeStyles.border}
                              border shadow-sm
                            `}>
                              {typeStyles.label}
                            </span>
                            <time className="text-sm text-gray-500 font-medium">
                              {version.date}
                            </time>
                          </div>
                          
                          <h3 className="text-lg font-semibold mt-3 text-gray-800">
                            {version.title}
                          </h3>
                          
                          <ul className="mt-5 space-y-3 text-gray-600">
                            {version.description.map((item, i) => (
                              <li key={i} className="flex items-start gap-3 group">
                                <FontAwesomeIcon 
                                  icon={faCodeBranch} 
                                  className="mt-1 text-sm text-gray-400 group-hover:text-blue-500 transition-colors duration-200" 
                                />
                                <span className="text-sm leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </BaseCard>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default HistoryPage; 