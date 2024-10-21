import React from 'react';
import { useProfileLogic } from '../../hooks/profile/useProfileLogic';
import ProfileUI from '../../components/profile/ProfileUI';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const ProfilePage: React.FC = () => {
  const profileLogic = useProfileLogic();

  return (
    <div className="bg-gray-100 text-gray-900 min-h-screen flex flex-col">
      <Navbar setCurrentSourcePage={() => {}} />
      <ProfileUI 
        {...profileLogic} 
        uploadMessage={profileLogic.uploadMessage || ''} 
        passwordMessage={profileLogic.passwordMessage || ''} 
        setIsEditable={() => {}} // 添加這行
      />
      <Footer />
    </div>
  );
};

export default ProfilePage;
