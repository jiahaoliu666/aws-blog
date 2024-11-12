import React from 'react';
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
  const { preferences } = useProfilePreferences();
  const [tempSettings, setTempSettings] = React.useState(initialSettings);

  const handleSettingsChange = (key: string, value: any) => {
    console.log('設定變更:', key, value);
    const newSettings = {
      ...tempSettings,
      [key]: value
    };
    setTempSettings(newSettings);
    handleSettingChange(key, value);
  };

  const handleSave = async () => {
    const userId = user?.id || user?.sub;
    
    if (!userId) {
      showToast('無法儲存設定', 'error', {
        description: '請先登入後再試',
        position: 'top-right',
        duration: 3000
      });
      return;
    }

    if (JSON.stringify(tempSettings) === JSON.stringify(preferences)) {
      showToast('未變更', 'info', {
        description: '設定未變更',
        position: 'top-right',
        duration: 3000
      });
      return;
    }

    try {
      const settingsToSave = {
        ...tempSettings,
        userId: userId
      };
      
      showToast('正在儲存設定...', 'loading', {
        description: '請稍候',
        position: 'top-right',
        duration: 1000
      });
      
      await onSave(settingsToSave);
      
      showToast('偏好設定已成功儲存！', 'success', {
        description: '您的偏好設定已成功儲存',
        position: 'top-right',
        duration: 3000
      });
    } catch (error) {
      console.error('儲存設定時發生錯誤:', error);
      showToast('儲存失敗', 'error', {
        description: '無法儲存設定，請稍後再試',
        position: 'top-right',
        duration: 4000
      });
    }
  };

  const handleCancel = () => {
    setTempSettings(preferences);
    showToast('設定已重置為默認值', 'info', {
      description: '設定已重置為伺服器上的值',
      position: 'top-right',
      duration: 3000
    });
  };

  React.useEffect(() => {
    setTempSettings(initialSettings);
  }, [initialSettings]);

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">文章偏好設定</h1>
        <p className="mt-2 text-gray-600">自訂您的使用體驗</p>
      </div>

      <div className="space-y-6">
        {/* 主題設定 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <FontAwesomeIcon icon={faPalette} className="text-xl text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">主題設定</h3>
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
                  onClick={() => handleSettingsChange('theme', theme.id)}
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
        </div>
        {/* 視圖設定 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <FontAwesomeIcon icon={faTableColumns} className="text-xl text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">視圖設定</h3>
                <p className="text-sm text-gray-600">選擇您偏好的顯示方式</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'grid', icon: faList, label: '列表視圖' },
                { id: 'list', icon: faTableCells, label: '網格視圖' }
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => handleSettingsChange('viewMode', view.id)}
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
        </div>

        {/* 一鍵總結設定 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
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
                  onChange={(e) => handleSettingsChange('autoSummarize', e.target.checked)}
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
        </div>

        {/* 語言設定 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <FontAwesomeIcon icon={faLanguage} className="text-xl text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">語言設定</h3>
                <p className="text-sm text-gray-600">選擇您偏好的顯示語言</p>
              </div>
            </div>
            <select
              value={tempSettings.language}
              onChange={(e) => handleSettingsChange('language', e.target.value)}
              className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="zh-TW">繁體中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* 儲存和取消按鈕 */}
        <div className="flex justify-end pt-4 gap-2">
          {JSON.stringify(tempSettings) !== JSON.stringify(preferences) && (
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              取消
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⌛</span>
                儲存中...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className="mr-2" />
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