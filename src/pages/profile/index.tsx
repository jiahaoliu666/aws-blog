// src/pages/profile/index.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Footer from '../../components/common/Footer';
import Navbar from '../../components/common/Navbar';
import { useAuthContext } from '../../context/AuthContext';

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { user, logoutUser } = useAuthContext();
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user ? user.username : '',
    email: user ? user.username : '', // 根據實際需要調整
    registrationDate: '[註冊日期]',
    bio: '這裡是用戶的簡單自我介紹或個人簡介。',
    interests: '標籤1, 標籤2, 標籤3',
    socialMedia: '[社交媒體連結]',
    address: '[用戶地址]',
    phone: '[電話號碼]',
  });

  useEffect(() => {
    // 檢查用戶是否登錄，如果未登錄，顯示訊息並重定向到登錄頁面
    if (user === null) { // 確保當 user 為 null 時顯示登入訊息
      setShowLoginMessage(true);
      const timer = setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
      return () => clearTimeout(timer);
    } else if (user) {
      // 當用戶登入時，可以將用戶資訊更新到表單
      setFormData(prevData => ({
        ...prevData,
        username: user.username,
        email: user.username, // 根據實際需要調整
      }));
      setShowLoginMessage(false);
    }
  }, [user, router]);

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCloseModal = () => {
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaveChanges = () => {
    // 在這裡實現保存變更的邏輯，可能涉及 API 調用來更新用戶資料
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-200">
      <Navbar />
      <div className="profile-container flex-grow p-5">
        {showLoginMessage ? (
          <div className="text-center py-10">
            <h2 className="text-2xl font-semibold text-red-600">請先登入!</h2>
            <p className="text-lg text-gray-700">您將在幾秒後被重定向至登入頁面...</p>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-4 text-gray-800">個人資料</h1>
            <div className="flex items-center mb-6">
              <img
                src="/path/to/avatar.jpg" // 替換為實際用戶頭像的 URL
                alt="用戶頭像"
                className="w-24 h-24 rounded-full border-2 border-blue-500 mr-4"
              />
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">用戶名: {formData.username}</h2>
                <p className="text-lg text-gray-700">電子郵件: {formData.email}</p>
                <p className="text-lg text-gray-700">註冊日期: {formData.registrationDate}</p>
                <p className="text-lg text-gray-700">地址: {formData.address}</p>
                <p className="text-lg text-gray-700">電話: {formData.phone}</p>
              </div>
            </div>
            <div className="profile-info bg-white p-4 rounded shadow-md mb-6">
              <h3 className="text-xl font-bold text-gray-800">額外資訊</h3>
              <p><strong>個人簡介:</strong> {formData.bio}</p>
              <p><strong>興趣:</strong> {formData.interests}</p>
              <p><strong>社交媒體:</strong> {formData.socialMedia}</p>
            </div>
            <div className="activity-log bg-white p-4 rounded shadow-md mb-6">
              <h3 className="text-xl font-bold text-gray-800">過去的觀看紀錄</h3>
              <ul className="list-disc list-inside">
                <li>觀看紀錄 1 - 描述</li>
                <li>觀看紀錄 2 - 描述</li>
                <li>觀看紀錄 3 - 描述</li>
              </ul>
            </div>
            <div className="profile-actions mt-6">
              <button onClick={handleEditProfile} className="mr-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200">
                編輯個人資料
              </button>
              <button onClick={handleLogout} className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-700 transition duration-200">
                登出
              </button>
            </div>
            {isEditing && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-4 rounded shadow-md w-1/3">
                  <h2 className="text-xl font-bold mb-4">編輯個人資料</h2>
                  <div className="mb-4">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">個人簡介</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      className="mt-1 p-2 border border-gray-300 rounded w-full"
                      rows={3}
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="interests" className="block text-sm font-medium text-gray-700">興趣</label>
                    <input
                      id="interests"
                      name="interests"
                      value={formData.interests}
                      onChange={handleChange}
                      className="mt-1 p-2 border border-gray-300 rounded w-full"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="socialMedia" className="block text-sm font-medium text-gray-700">社交媒體連結</label>
                    <input
                      id="socialMedia"
                      name="socialMedia"
                      value={formData.socialMedia}
                      onChange={handleChange}
                      className="mt-1 p-2 border border-gray-300 rounded w-full"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button onClick={handleCloseModal} className="mr-4 bg-gray-300 py-2 px-4 rounded">
                      取消
                    </button>
                    <button onClick={handleSaveChanges} className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200">
                      保存變更
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;
