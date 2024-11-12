import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMoon, 
  faSun, 
  faGlobe, 
  faPalette,
  faLanguage,
} from '@fortawesome/free-solid-svg-icons';

interface SettingsSectionProps {
  settings: {
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  onSave: (settings: { theme: 'light' | 'dark' | 'system'; language: string; }) => void;
  isLoading: boolean;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  settings: initialSettings,
  onSave,
  isLoading
}) => {
  const [tempSettings, setTempSettings] = React.useState(initialSettings);

  const handleSettingChange = (setting: string, value: any) => {
    setTempSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">偏好設定</h1>
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
              {['light', 'dark', 'system'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => handleSettingChange('theme', theme)}
                  className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
                    tempSettings.theme === theme
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                  disabled={isLoading}
                >
                  <FontAwesomeIcon 
                    icon={theme === 'light' ? faSun : theme === 'dark' ? faMoon : faGlobe}
                    className={`text-xl ${tempSettings.theme === theme ? 'text-blue-500' : 'text-gray-600'}`}
                  />
                  <span className={`font-medium ${tempSettings.theme === theme ? 'text-blue-700' : 'text-gray-700'}`}>
                    {theme === 'light' ? '淺色模式' : theme === 'dark' ? '深色模式' : '系統預設'}
                  </span>
                </button>
              ))}
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
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="zh-TW">繁體中文</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </div>

        {/* 儲存按鈕 */}
        <div className="flex justify-end pt-4">
          <button
            onClick={() => onSave(tempSettings)}
            disabled={isLoading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⌛</span>
                儲存中...
              </>
            ) : (
              '儲存設定'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;