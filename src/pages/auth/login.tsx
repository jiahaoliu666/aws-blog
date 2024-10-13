// src/pages/auth/login.tsx  
import React, { useState, useEffect } from 'react';  
import { Input, PasswordField } from '@aws-amplify/ui-react';  
import '@aws-amplify/ui-react/styles.css';  
import Link from 'next/link';  
import { useRouter } from 'next/router';  
import Navbar from '../../components/common/Navbar';  
import ErrorMessage from '../../components/common/ErrorMessage';  
import { useAuthContext } from '../../context/AuthContext';  

const LoginPage: React.FC = () => {  
  const router = useRouter();  
  const { loginUser, error, clearError } = useAuthContext();  
  const [email, setEmail] = useState('');  
  const [password, setPassword] = useState('');  
  const [success, setSuccess] = useState<string | null>(null);  

  useEffect(() => {  
    if (error) {  
      console.log("Error state changed:", error);  
    }  
  }, [error]);  

  const handleLogin = async (e: React.FormEvent) => {  
    e.preventDefault();  
    setSuccess(null);  

    // Clear any existing error before attempting a new login  
    clearError();  

    try {  
      const loginSucceeded = await loginUser(email, password);  

      if (loginSucceeded) {  
        setSuccess('登入成功！');  
        setTimeout(() => {  
          router.push('/news'); // redirect after a delay  
        }, 3000);  
      }  
    } catch (err: any) {  
      console.log("Log in failed, error message set", err.message || err);  
    }  
  };  

  // Function to map technical errors to user-friendly messages  
  const errorMessage = (error: string): string => {  
    console.log("Processing error:", error); // 調試輸出  

    if (error.includes("User is not confirmed")) {  
      return "您的帳戶尚未確認。請檢查您的電子郵件以確認帳戶。";  
    }  
    // 可以在這裡添加更多條件來處理不同的錯誤類型  

    return "請確認電子郵件或密碼是否輸入正確。";  
  };  

  return (  
    <div className="flex flex-col min-h-screen bg-gray-200">  
      <Navbar />  
      <div className="flex items-center justify-center flex-grow">  
        <form className="bg-white p-10 rounded-lg shadow-lg w-96" onSubmit={handleLogin}>  
          <h2 className="text-3xl font-semibold mb-6 text-center text-gray-800">登入</h2>  
          <div className="mb-4">  
            <label htmlFor="email" className="text-base text-gray-700">電子郵件</label>  
            <Input  
              id="email"  
              name="email"  
              type="email"  
              placeholder="@example.com"  
              value={email}  
              onChange={(e) => setEmail(e.target.value)}  
              required  
              className="border border-gray-300 p-2 rounded"  
              style={{ marginTop: '8px' }}  
            />  
          </div>  
          <div className="mb-6">  
            <PasswordField  
              label="密碼"  
              id="password"  
              value={password}  
              onChange={(e) => setPassword(e.target.value)}  
              placeholder="輸入密碼"  
              required  
              className="border border-gray-300 p-2 rounded mt-1"  
            />  
          </div>  
          {error && <ErrorMessage message={errorMessage(error)} />}  
          {success && <div className="text-green-500 mb-5 bg-green-100 p-2 rounded">{success}</div>}  
          <button  
            type="submit"  
            className="bg-blue-600 text-white rounded w-full py-3 hover:bg-blue-700 transition duration-150 mb-4"  
          >  
            登入  
          </button>  
          <div className="mt-0 text-center">  
            <Link href="/auth/forgot-password">  
              <span className="text-blue-500 hover:underline cursor-pointer">忘記密碼?</span>  
            </Link>  
          </div>  
          <div className="mt-4 text-center">  
            <Link href="/auth/register">  
              <span className="bg-green-600 text-white rounded w-full py-3 inline-block text-center hover:bg-green-700 transition duration-150 cursor-pointer">  
                註冊  
              </span>  
            </Link>  
          </div>  
        </form>  
      </div>  
    </div>  
  );  
};  

export default LoginPage;