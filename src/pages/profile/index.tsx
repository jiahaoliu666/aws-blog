import React from 'react';
import { useProfileLogic } from '../../hooks/profile/useProfileLogic';
import ProfileUI from '../../components/profile/ProfileUI';

const ProfilePage: React.FC = () => {
  const profileLogic = useProfileLogic();

  return (
    <div className="bg-gray-100 text-gray-900 min-h-screen flex flex-col">
      <ProfileUI 
        {...profileLogic} 
        uploadMessage={profileLogic.uploadMessage || ''} 
        passwordMessage={profileLogic.passwordMessage || ''} 
        setIsEditable={() => {}} 
        user={profileLogic.user ? {
          ...profileLogic.user,
          email: profileLogic.user.email || '',
          avatar: profileLogic.user.avatar || ''
        } : null}
      />
    </div>
  );
};

export default ProfilePage;
