// src/components/common/UserProfile.tsx  
import React, { useEffect } from 'react';  
import { useAuthContext } from '../../context/AuthContext';  

const UserProfile: React.FC = () => {  
  const { user } = useAuthContext();  

  useEffect(() => {  
    console.log("Username in UserProfile:", user?.username);  
  }, [user]);  

  return (  
    <div className="p-4 bg-white shadow-md rounded-md">  
      <h1 className="text-xl font-semibold">  
        Welcome, {user?.username || 'Guest'}!  
      </h1>  
    </div>  
  );  
};  

export default UserProfile;