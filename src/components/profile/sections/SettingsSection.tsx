import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMoon, 
  faSun, 
  faGlobe, 
  faVolumeMute,
  faVolumeUp,
  faEye,
  faEyeSlash,
  faPalette,
  faLanguage,
  faShieldAlt
} from '@fortawesome/free-solid-svg-icons';
import { Switch } from '@headlessui/react';

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
                    settings.theme === theme
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                  disabled={isLoading}
                >
                  <FontAwesomeIcon 
                    icon={theme === 'light' ? faSun : theme === 'dark' ? faMoon : faGlobe}
                    className={`text-xl ${settings.theme === theme ? 'text-blue-500' : 'text-gray-600'}`}
                  />
                  <span className={`font-medium ${settings.theme === theme ? 'text-blue-700' : 'text-gray-700'}`}>
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
              value={settings.language}
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

        {/* 自動播放設定 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FontAwesomeIcon 
                  icon={settings.autoplay ? faVolumeUp : faVolumeMute}
                  className="text-xl text-blue-500"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">自動播放</h3>
                  <p className="text-sm text-gray-600">控制影片的自動播放行為</p>
                </div>
              </div>
              <Switch
                checked={settings.autoplay}
                onChange={(checked) => handleSettingChange('autoplay', checked)}
                className={`${
                  settings.autoplay ? 'bg-blue-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                disabled={isLoading}
              >
                <span className="sr-only">啟用自動播放</span>
                <span
                  className={`${
                    settings.autoplay ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>
          </div>
        </div>

        {/* 隱私設定 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <FontAwesomeIcon icon={faShieldAlt} className="text-xl text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">隱私設定</h3>
                <p className="text-sm text-gray-600">管理您的個人資料可見度</p>
              </div>
            </div>
            <div className="space-y-3">
              {['public', 'private', 'friends'].map((privacy) => (
                <div
                  key={privacy}
                  onClick={() => handleSettingChange('privacy', privacy)}
                  className={`p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                    settings.privacy === privacy
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon 
                      icon={privacy === 'private' ? faEyeSlash : faEye}
                      className={`text-lg ${settings.privacy === privacy ? 'text-blue-500' : 'text-gray-600'}`}
                    />
                    <span className={`font-medium ${settings.privacy === privacy ? 'text-blue-700' : 'text-gray-700'}`}>
                      {privacy === 'public' ? '公開' : privacy === 'private' ? '私密' : '好友'}
                    </span>
                  </div>
                  <input
                    type="radio"
                    checked={settings.privacy === privacy}
                    onChange={() => handleSettingChange('privacy', privacy)}
                    disabled={isLoading}
                    className="form-radio h-5 w-5 text-blue-600 border-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection; 