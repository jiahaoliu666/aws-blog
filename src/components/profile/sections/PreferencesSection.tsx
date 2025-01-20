import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMoon, 
  faSun, 
  faPalette,
  faLanguage,
  faMagicWandSparkles,
  faTableCells,
  faList,
  faTableColumns,
  faSave,
} from '@fortawesome/free-solid-svg-icons';
import { useAuthContext } from '@/context/AuthContext';
import { useToastContext } from '@/context/ToastContext';
import { useProfilePreferences } from '@/hooks/profile/useProfilePreferences';
import { useTheme } from '@/context/ThemeContext';
import { SectionTitle } from '../common/SectionTitle';
import { Card } from '../common/Card';

interface SettingsSectionProps {
  settings: {
    theme: 'light' | 'dark';
    language: string;
    autoSummarize: boolean;
    viewMode: 'grid' | 'list';
  };
  handleSettingChange: (key: string, value: any) => void;
  onSave: (settings: any) => Promise<void>;
  isLoading: boolean;
}

const PreferencesSection: React.FC<SettingsSectionProps> = ({
  settings: initialSettings,
  handleSettingChange,
  onSave,
  isLoading
}) => {
  const { user } = useAuthContext();
  const { showToast } = useToastContext();
  const { preferences, clearPreferences } = useProfilePreferences();
  const { setThemeMode } = useTheme();
  
  // 使用本地狀態來追蹤暫時的設定變更
  const [tempSettings, setTempSettings] = useState(initialSettings);
  // 追蹤是否有未儲存的變更
  const [hasChanges, setHasChanges] = useState(false);

  // 當初始設定或資料庫設定改變時更新本地狀態
  useEffect(() => {
    if (preferences) {
      setTempSettings({
        theme: preferences.theme,
        language: preferences.language,
        viewMode: preferences.viewMode,
        autoSummarize: preferences.autoSummarize
      });
    }
  }, [preferences]);

  // 監聽登出事件
  useEffect(() => {
    const handleLogout = () => {
      // 重置所有本地狀態
      setTempSettings(initialSettings);
      setHasChanges(false);
    };

    window.addEventListener('logout', handleLogout);
    return () => {
      window.removeEventListener('logout', handleLogout);
    };
  }, [initialSettings]);

  // 處理本地設定變更
  const handleLocalSettingChange = (key: string, value: any) => {
    setTempSettings(prev => ({
      ...prev,
      [key]: value
    }));

    // 檢查是否所有設定都與原始設定相同
    const newSettings = {
      ...tempSettings,
      [key]: value
    };
    
    const hasAnyChanges = 
      newSettings.theme !== preferences.theme ||
      newSettings.language !== preferences.language ||
      newSettings.viewMode !== preferences.viewMode ||
      newSettings.autoSummarize !== preferences.autoSummarize;

    setHasChanges(hasAnyChanges);
  };

  // 處理視圖模式切換
  const handleViewModeChange = (mode: 'grid' | 'list') => {
    handleLocalSettingChange('viewMode', mode);
  };

  // 儲存設定到資料庫
  const handleSave = async () => {
    const userId = user?.id || user?.sub;
    
    if (!userId) {
      showToast('無法儲存設定', 'error', {
        description: '請先登入後再試'
      });
      return;
    }

    try {
      await onSave({ ...tempSettings, userId });
      setThemeMode(tempSettings.theme === 'dark');
      setHasChanges(false);
      showToast('設定已儲存', 'success');
      
      // 使用 setTimeout 延遲重整頁面
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      showToast('儲存失敗', 'error');
      // 發生錯誤時重置為原始設定
      setTempSettings(preferences);
      setHasChanges(false);
    }
  };

  // 取消變更，重置為資料庫中的設定
  const handleCancel = () => {
    if (preferences) {
      setTempSettings({
        theme: preferences.theme,
        language: preferences.language,
        viewMode: preferences.viewMode,
        autoSummarize: preferences.autoSummarize
      });
      setHasChanges(false);
    }
    showToast('已取消設定', 'info', {
      description: '設定已重置為伺服器上的值'
    });
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <SectionTitle  // 使用共用的 SectionTitle 組件
          title="偏好設定"
          description="自訂您閱讀文章的偏好設定"
        />
      </div>

      <div className="space-y-6">
        {/* 主題設定 */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <FontAwesomeIcon icon={faPalette} className="text-xl text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">文章主題</h3>
                <p className="text-sm text-gray-600">選擇您偏好的顯示模式</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'light', icon: faSun, label: '淺色模式' },
                { id: 'dark', icon: faMoon, label: '深色模式' }
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleLocalSettingChange('theme', theme.id)}
                  className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                    tempSettings.theme === theme.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                  disabled={isLoading}
                >
                  <FontAwesomeIcon 
                    icon={theme.icon}
                    className={`text-xl ${tempSettings.theme === theme.id ? 'text-blue-500' : 'text-gray-600'}`}
                  />
                  <span className={`font-medium ${tempSettings.theme === theme.id ? 'text-blue-700' : 'text-gray-700'}`}>
                    {theme.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>
        {/* 視圖設定 */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <FontAwesomeIcon icon={faTableColumns} className="text-xl text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">文章視圖</h3>
                <p className="text-sm text-gray-600">選擇您偏好的文章顯示方式</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'list', icon: faList, label: '列表視圖' },
                { id: 'grid', icon: faTableCells, label: '網格視圖' }
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => handleLocalSettingChange('viewMode', view.id)}
                  className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                    tempSettings.viewMode === view.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                  disabled={isLoading}
                >
                  <FontAwesomeIcon 
                    icon={view.icon}
                    className={`text-xl ${tempSettings.viewMode === view.id ? 'text-blue-500' : 'text-gray-600'}`}
                  />
                  <span className={`font-medium ${tempSettings.viewMode === view.id ? 'text-blue-700' : 'text-gray-700'}`}>
                    {view.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* 一鍵總結設定 */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <FontAwesomeIcon icon={faMagicWandSparkles} className="text-xl text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">一鍵總結</h3>
                <p className="text-sm text-gray-600">自動顯示全部總結</p>
              </div>
            </div>
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={tempSettings.autoSummarize}
                  onChange={(e) => handleLocalSettingChange('autoSummarize', e.target.checked)}
                  className="sr-only peer"
                  disabled={isLoading}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {tempSettings.autoSummarize ? '已啟用' : '已停用'}
                </span>
              </label>
            </div>
          </div>
        </Card>

        {/* 語言設定 */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <FontAwesomeIcon icon={faLanguage} className="text-xl text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">語言設定</h3>
                <p className="text-sm text-gray-600">選擇您偏好的顯示語言</p>
              </div>
            </div>
            <select
              value={tempSettings.language}
              onChange={(e) => handleLocalSettingChange('language', e.target.value)}
              className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="zh-TW">繁體中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </Card>

        {/* 儲存和取消按鈕 */}
        <div className="flex justify-end pt-4 gap-3">
          {hasChanges && (
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 rounded-lg text-gray-700 border border-gray-200
                hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              取消
            </button>
          )}
          
          <button
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
            className={`
              px-6 py-2.5 rounded-lg flex items-center gap-2
              ${isLoading || !hasChanges 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
              transition-all duration-200
            `}
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⌛</span>
                儲存中...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} />
                儲存設定
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesSection;