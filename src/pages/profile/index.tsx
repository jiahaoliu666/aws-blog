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
    if (user === null) {
      setShowLoginMessage(true);
      const timer = setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
      return () => clearTimeout(timer);
    } else if (user) {
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
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push('/auth/login');
  };

  return (
    <div className={`${user ? "bg-gray-100 text-gray-900" : "bg-gradient-to-r from-blue-100 to-purple-100"} min-h-screen flex flex-col`}>
      <Navbar />
      <div className="container mx-auto flex-grow p-5"> {/* 使用 container 和 mx-auto 來保持佈局一致 */}
        {showLoginMessage ? (
          <div className="text-center py-10">
            <h2 className="text-2xl font-semibold text-red-600">請先登入!</h2>
            <p className="text-lg text-gray-700">您將在幾秒後被重定向至登入頁面...</p>
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-4 text-gray-800">個人資料</h1>
            <div className="flex items-center mb-6">
              <img
                src="/path/to/avatar.jpg"
                alt="用戶頭像"
                className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg mr-4"
              />
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">用戶名: {formData.username}</h2>
                <p className="text-lg text-gray-700">電子郵件: {formData.email}</p>
                <p className="text-lg text-gray-700">註冊日期: {formData.registrationDate}</p>
                <p className="text-lg text-gray-700">地址: {formData.address}</p>
                <p className="text-lg text-gray-700">電話: {formData.phone}</p>
              </div>
            </div>
            <div className="profile-info bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-xl font-bold text-gray-800">額外資訊</h3>
              <p className="mt-2"><strong>個人簡介:</strong> {formData.bio}</p>
              <p className="mt-2"><strong>興趣:</strong> {formData.interests}</p>
              <p className="mt-2"><strong>社交媒體:</strong> {formData.socialMedia}</p>
            </div>
            <div className="activity-log bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-xl font-bold text-gray-800">過去的觀看紀錄</h3>
              <ul className="list-disc list-inside mt-2">
                <li>觀看紀錄 1 - 描述</li>
                <li>觀看紀錄 2 - 描述</li>
                <li>觀看紀錄 3 - 描述</li>
              </ul>
            </div>
            <div className="profile-actions mt-6 flex justify-end">
              <button onClick={handleEditProfile} className="mr-4 bg-blue-600 text-white py-2 px-6 rounded-full hover:bg-blue-700 transition duration-200 shadow-md">
                編輯個人資料
              </button>
              <button onClick={handleLogout} className="bg-red-600 text-white py-2 px-6 rounded-full hover:bg-red-700 transition duration-200 shadow-md">
                登出
              </button>
            </div>
            {isEditing && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
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
                    <button onClick={handleCloseModal} className="mr-4 bg-gray-300 py-2 px-4 rounded-full">
                      取消
                    </button>
                    <button onClick={handleSaveChanges} className="bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 transition duration-200">
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
