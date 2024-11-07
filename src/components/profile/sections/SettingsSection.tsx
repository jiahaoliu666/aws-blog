import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMoon, 
  faSun, 
  faGlobe, 
  faVolumeMute,
  faVolumeUp,
  faEye,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';

interface SettingsSectionProps {
  settings: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    autoplay: boolean;
    notifications: boolean;
    privacy: 'public' | 'private' | 'friends';
  };
  handleSettingChange: (setting: string, value: any) => void;
  isLoading: boolean;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  settings,
  handleSettingChange,
  isLoading
}) => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 border-b pb-4">偏好設定</h1>

      <div className="space-y-6">
        {/* 主題設定 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">主題設定</h2>
          <div className="grid grid-cols-3 gap-4">
            {['light', 'dark', 'system'].map((theme) => (
              <button
                key={theme}
                onClick={() => handleSettingChange('theme', theme)}
                className={`p-4 rounded-lg flex flex-col items-center space-y-2 transition-all ${
                  settings.theme === theme
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                disabled={isLoading}
              >
                <FontAwesomeIcon 
                  icon={theme === 'light' ? faSun : theme === 'dark' ? faMoon : faGlobe}
                  className={`text-2xl ${settings.theme === theme ? 'text-blue-500' : 'text-gray-600'}`}
                />
                <span className="capitalize">{theme}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 語言設定 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">語言設定</h2>
          <select
            value={settings.language}
            onChange={(e) => handleSettingChange('language', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="zh-TW">繁體中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </div>

        {/* 自動播放設定 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">自動播放設定</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FontAwesomeIcon 
                icon={settings.autoplay ? faVolumeUp : faVolumeMute}
                className="text-2xl text-gray-600 mr-3"
              />
              <span>自動播放影片</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.autoplay}
                onChange={(e) => handleSettingChange('autoplay', e.target.checked)}
                disabled={isLoading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* 隱私設定 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">隱私設定</h2>
          <div className="space-y-4">
            {['public', 'private', 'friends'].map((privacy) => (
              <div
                key={privacy}
                onClick={() => handleSettingChange('privacy', privacy)}
                className={`p-4 rounded-lg flex items-center justify-between cursor-pointer ${
                  settings.privacy === privacy
                    ? 'bg-blue-100'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center">
                  <FontAwesomeIcon 
                    icon={privacy === 'private' ? faEyeSlash : faEye}
                    className="mr-3"
                  />
                  <span className="capitalize">{privacy}</span>
                </div>
                <input
                  type="radio"
                  checked={settings.privacy === privacy}
                  onChange={() => handleSettingChange('privacy', privacy)}
                  disabled={isLoading}
                  className="form-radio h-5 w-5 text-blue-600"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection; 