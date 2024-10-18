// src/pages/settings/index.tsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Footer from '../../components/common/Footer';
import Navbar from '../../components/common/Navbar';
import { useAuthContext } from '../../context/AuthContext';

const SettingsPage: React.FC = () => {
  const { user } = useAuthContext();
  const router = useRouter();
  const [showLoginMessage, setShowLoginMessage] = useState(false);

  useEffect(() => {
    if (!user) {
      setShowLoginMessage(true);
      const timer = setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowLoginMessage(false);
    }
  }, [user, router]);

  return (
    <div className={`${user ? "bg-gray-100 text-gray-900" : "bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800"} min-h-screen flex flex-col`}>
      <Navbar />
      <div className="container mx-auto flex-grow p-5"> {/* 使用 container 和 mx-auto 來保持佈局一致 */}
        {showLoginMessage ? (
          <div className="text-center py-10">
            <h2 className="text-3xl font-semibold text-red-600">請先登入!</h2>
            <p className="text-lg text-gray-700">您將被重新導向至登入頁面...</p>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-6 text-center">設定</h1>
            <div className="flex flex-col lg:flex-row">
              <div className="w-full lg:w-1/4 pr-0 lg:pr-4 mb-4 lg:mb-0">
                <ul className="space-y-4 bg-white p-4 rounded-lg shadow-lg">
                  <li className="font-bold text-lg hover:text-blue-600 cursor-pointer">一般設定</li>
                  <li className="hover:text-blue-600 cursor-pointer">筆記設定</li>
                  <li className="font-bold text-lg hover:text-blue-600 cursor-pointer">通知</li>
                  <li className="hover:text-blue-600 cursor-pointer">其他服務授權</li>
                  <li className="hover:text-blue-600 cursor-pointer">社群</li>
                  <li className="hover:text-blue-600 cursor-pointer">API</li>
                  <li className="hover:text-blue-600 cursor-pointer">Preview features</li>
                </ul>
              </div>

              <div className="w-full lg:w-3/4 bg-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-6">通知方式</h2>
                <div className="mb-8">
                  <h3 className="font-bold mb-4">預設通知方式</h3>
                  <div className="flex items-center mb-4">
                    <input type="checkbox" id="general-email" className="mr-2" />
                    <label htmlFor="general-email" className="mr-4">Email</label>
                    <input type="checkbox" id="general-web" className="mr-2" />
                    <label htmlFor="general-web">網頁通知</label>
                  </div>
                  <div className="flex items-center mb-4">
                    <input type="checkbox" id="important-email" className="mr-2" />
                    <label htmlFor="important-email" className="mr-4">Email</label>
                    <input type="checkbox" id="important-web" className="mr-2" />
                    <label htmlFor="important-web">網頁通知</label>
                  </div>
                  <div className="flex items-center mb-4">
                    <label htmlFor="email-frequency" className="mr-4">Email 通知頻率</label>
                    <select id="email-frequency" className="bg-gray-200 text-gray-900 p-2 rounded-lg">
                      <option>每十五分鐘一次</option>
                      <option>每小時一次</option>
                      <option>每天一次</option>
                    </select>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="font-bold mb-4">社群通知</h3>
                  <div className="flex items-center mb-4">
                    <input type="checkbox" id="user-mentions" className="mr-2" />
                    <label htmlFor="user-mentions" className="mr-4">有使用者提及你</label>
                    <input type="checkbox" id="user-web" className="mr-2" />
                    <label htmlFor="user-web">網頁通知</label>
                  </div>
                  <div className="flex items-center mb-4">
                    <input type="checkbox" id="post-email" className="mr-2" />
                    <label htmlFor="post-email" className="mr-4">Email</label>
                    <input type="checkbox" id="post-web" className="mr-2" />
                    <label htmlFor="post-web">網頁通知</label>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-4">其它設定</h3>
                  <div className="flex items-center">
                    <input type="checkbox" id="auto-subscribe" className="mr-2" />
                    <label htmlFor="auto-subscribe">自動訂閱我所參與的筆記</label>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SettingsPage;
