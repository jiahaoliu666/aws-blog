// src/pages/settings/index.tsx
import React from 'react';
import Footer from '../../components/common/Footer';
import Navbar from '../../components/common/Navbar';

const SettingsPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-200 text-gray-800">
      <Navbar />
      <div className="settings-container flex-grow p-5">
        <h1 className="text-3xl font-bold mb-4">設定</h1>
        <div className="flex flex-col lg:flex-row">
          {/* 側邊欄 */}
          <div className="w-full lg:w-1/4 pr-0 lg:pr-4 mb-4 lg:mb-0">
            <ul className="space-y-2">
              <li className="font-bold">一般設定</li>
              <li>筆記設定</li>
              <li className="font-bold">通知</li>
              <li>其他服務授權</li>
              <li>社群</li>
              <li>API</li>
              <li>Preview features</li>
            </ul>
          </div>

          {/* 主要內容 */}
          <div className="w-full lg:w-3/4 bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-bold mb-4">通知方式</h2>
            <div className="mb-6">
              <h3 className="font-bold mb-2">預設通知方式</h3>
              <div className="flex items-center mb-2">
                <input type="checkbox" id="general-email" className="mr-2" />
                <label htmlFor="general-email" className="mr-4">Email</label>
                <input type="checkbox" id="general-web" className="mr-2" />
                <label htmlFor="general-web">網頁通知</label>
              </div>
              <div className="flex items-center mb-2">
                <input type="checkbox" id="important-email" className="mr-2" />
                <label htmlFor="important-email" className="mr-4">Email</label>
                <input type="checkbox" id="important-web" className="mr-2" />
                <label htmlFor="important-web">網頁通知</label>
              </div>
              <div className="flex items-center mb-2">
                <label htmlFor="email-frequency" className="mr-4">Email 通知頻率</label>
                <select id="email-frequency" className="bg-gray-300 text-gray-900 p-2 rounded">
                  <option>每十五分鐘一次</option>
                  <option>每小時一次</option>
                  <option>每天一次</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold mb-2">社群通知</h3>
              <div className="flex items-center mb-2">
                <input type="checkbox" id="user-mentions" className="mr-2" />
                <label htmlFor="user-mentions" className="mr-4">有使用者提及你</label>
                <input type="checkbox" id="user-web" className="mr-2" />
                <label htmlFor="user-web">網頁通知</label>
              </div>
              <div className="flex items-center mb-2">
                <input type="checkbox" id="post-email" className="mr-2" />
                <label htmlFor="post-email" className="mr-4">Email</label>
                <input type="checkbox" id="post-web" className="mr-2" />
                <label htmlFor="post-web">網頁通知</label>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">其它設定</h3>
              <div className="flex items-center">
                <input type="checkbox" id="auto-subscribe" className="mr-2" />
                <label htmlFor="auto-subscribe">自動訂閱我所參與的筆記</label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SettingsPage;
