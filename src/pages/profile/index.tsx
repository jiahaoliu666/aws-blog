import React from 'react';
import { useProfileCore } from '../../hooks/profile/useProfileCore';
import { useProfileForm } from '../../hooks/profile/useProfileForm';
import { useProfileAvatar } from '../../hooks/profile/useProfileAvatar';
import { useProfilePassword } from '../../hooks/profile/useProfilePassword';
import ProfileUI from '../../components/profile/ProfileUI';

const ProfilePage: React.FC = () => {
  const profileCore = useProfileCore();
  const profileForm = useProfileForm({ user: profileCore.user, updateUser: profileCore.updateUser });
  const profileAvatar = useProfileAvatar({ 
    user: profileCore.user, 
    setFormData: profileForm.setFormData,
    updateUser: profileCore.updateUser
  });
  const profilePassword = useProfilePassword({ user: profileCore.user, handleLogout: profileCore.handleLogout });

  return (
    <div className="bg-gray-100 text-gray-900 min-h-screen flex flex-col">
      <ProfileUI 
        {...profileForm}
        {...profileAvatar}
        {...profilePassword}
        uploadMessage={profileAvatar.uploadMessage || ''}
        passwordMessage={profilePassword.passwordMessage || ''}
        setIsEditable={() => {}}
        user={profileCore.user ? {
          ...profileCore.user,
          email: profileCore.user.email || '',
          avatar: profileCore.user.avatar || ''
        } : null}
      />
    </div>
  );
};

export default ProfilePage;
