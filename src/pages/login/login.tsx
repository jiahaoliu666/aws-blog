import React from 'react';  

const LoginPage: React.FC = () => {  
  return (  
    <div className="flex items-center justify-center min-h-screen bg-gray-200">  
      <form className="bg-white p-8 rounded shadow-md w-80">  
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">登入</h2>  
        <div className="mb-4">  
          <label className="block text-gray-800 mb-2" htmlFor="email">電子郵件</label>  
          <input className="border border-gray-300 rounded w-full p-2 text-gray-800" type="email" id="email" required />  
        </div>  
        <div className="mb-4">  
          <label className="block text-gray-800 mb-2" htmlFor="password">密碼</label>  
          <input className="border border-gray-300 rounded w-full p-2 text-gray-800" type="password" id="password" required />  
        </div>  
        <button className="bg-blue-500 text-white rounded w-full py-2 hover:bg-blue-700 transition duration-200">登入</button>  
        <div className="mt-4 text-center">  
          <a href="#" className="text-blue-500 hover:underline">忘記密碼?</a>  
        </div>  
        <div className="mt-4 text-center">  
          <button className="bg-green-500 text-white rounded w-full py-2 hover:bg-green-600 transition duration-200">註冊</button>  
        </div>  
      </form>  
    </div>  
  );  
};  

export default LoginPage;