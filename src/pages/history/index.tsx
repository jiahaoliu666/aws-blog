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
    date: '2024-03-20',
    type: 'feature',
    title: '初始版本發布',
    description: [
      '建立基礎網站架構',
      '實作用戶認證系統',
      '新增最新公告、新聞、解決方案、架構參考、知識中心等功能',
      '支援文章收藏功能',
      '整合 LINE 通知功能',
      '支援多語言切換 (繁體中文/英文)',
      '實作個人化設定'
    ]
  },
  {
    version: '1.0.1',
    date: '2024-03-21',
    type: 'fix',
    title: '錯誤修復更新',
    description: [
      '修復通知系統延遲問題',
      '修正文章收藏同步問題',
      '改善登入流程的穩定性',
      '修復部分 UI 顯示問題'
    ]
  },
  {
    version: '1.0.2',
    date: '2024-03-22',
    type: 'improvement',
    title: '效能優化更新',
    description: [
      '優化頁面載入速度',
      '改善搜尋功能效能',
      '優化資料庫查詢效率',
      '改善使用者介面回應速度'
    ]
  },
  {
    version: '1.0.3',
    date: '2024-03-23',
    type: 'security',
    title: '安全性更新',
    description: [
      '強化密碼安全性要求',
      '更新認證機制',
      '增加 API 請求限制',
      '改善資料加密方式'
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
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        label: '新功能'
      };
    case 'fix':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        label: '錯誤修復'
      };
    case 'improvement':
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        label: '效能優化'
      };
    case 'security':
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        label: '安全性更新'
      };
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        label: '其他更新'
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 頁面標題 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-white shadow-md">
                <FontAwesomeIcon 
                  icon={faHistory} 
                  className="text-2xl text-blue-500" 
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  版本歷史
                </h1>
                <p className="text-sm text-gray-600">
                  追蹤系統更新與改進記錄
                </p>
              </div>
            </div>
          </div>

          {/* 版本時間軸 */}
          <div className="relative space-y-8">
            {versionHistory.map((version, index) => {
              const typeStyles = getTypeStyles(version.type);
              
              return (
                <div key={version.version} className="relative">
                  {/* 連接線 */}
                  {index !== versionHistory.length - 1 && (
                    <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200" />
                  )}
                  
                  <BaseCard className="relative bg-white">
                    <div className="p-6">
                      {/* 版本資訊 */}
                      <div className="flex items-start gap-4">
                        <div className={`
                          w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                          ${typeStyles.bg} ${typeStyles.text}
                        `}>
                          <FontAwesomeIcon icon={getTypeIcon(version.type)} className="text-xl" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-lg font-semibold text-gray-900">
                              版本 {version.version}
                            </h2>
                            <span className={`
                              px-2.5 py-1 rounded-full text-xs font-medium
                              ${typeStyles.bg} ${typeStyles.text} ${typeStyles.border}
                              border
                            `}>
                              {typeStyles.label}
                            </span>
                            <time className="text-sm text-gray-500">
                              {version.date}
                            </time>
                          </div>
                          
                          <h3 className="text-base font-medium mt-2 text-gray-800">
                            {version.title}
                          </h3>
                          
                          <ul className="mt-4 space-y-2 text-gray-600">
                            {version.description.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <FontAwesomeIcon 
                                  icon={faCodeBranch} 
                                  className="mt-1 text-sm text-gray-400" 
                                />
                                <span className="text-sm">{item}</span>
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