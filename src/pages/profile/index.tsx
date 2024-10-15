// src/pages/profile/index.tsx
import React, { useState } from 'react';
import Footer from '../../components/common/Footer';
import Navbar from '../../components/common/Navbar';

const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '用戶名',
    email: '[電子郵件]',
    registrationDate: '[註冊日期]',
    bio: '這裡是用戶的簡單自我介紹或個人簡介。',
    interests: '標籤1, 標籤2, 標籤3',
    socialMedia: '[社交媒體連結]',
    address: '[用戶地址]',
    phone: '[電話號碼]',
  });

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-200"> {/* 設置背景顏色 */}
      <Navbar />
      <div className="profile-container flex-grow p-5">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">個人資料</h1>

        {/* 用戶頭像區域 */}
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

        {/* 用戶其他信息區域 */}
        <div className="profile-info bg-white p-4 rounded shadow-md mb-6"> {/* 改成白色背景以增強對比 */}
          <h3 className="text-xl font-bold text-gray-800">額外資訊</h3>
          <p><strong>個人簡介:</strong> {formData.bio}</p>
          <p><strong>興趣:</strong> {formData.interests}</p>
          <p><strong>社交媒體:</strong> {formData.socialMedia}</p>
        </div>

        {/* 過去的作品或活動記錄 */}
        <div className="activity-log bg-white p-4 rounded shadow-md mb-6"> {/* 改成白色背景以增強對比 */}
          <h3 className="text-xl font-bold text-gray-800">過去的活動</h3>
          <ul className="list-disc list-inside">
            <li>活動 1 - 描述</li>
            <li>活動 2 - 描述</li>
            <li>活動 3 - 描述</li>
          </ul>
        </div>

        {/* 編輯個人資料按鈕 */}
        <div className="profile-actions mt-6">
          <button onClick={handleEditProfile} className="mr-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200">
            編輯個人資料
          </button>
          <button className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-700 transition duration-200">
            登出
          </button>
        </div>

        {/* 編輯模態框 */}
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
              {/* 可加入更多字段以編輯 */}
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
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;
