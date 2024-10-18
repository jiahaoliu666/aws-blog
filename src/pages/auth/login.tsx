import React, { useEffect, useState } from 'react';  
import { Input, PasswordField } from '@aws-amplify/ui-react';  
import '@aws-amplify/ui-react/styles.css';  
import Link from 'next/link';  
import { useRouter } from 'next/router';  
import Navbar from '../../components/common/Navbar';  
import ErrorMessage from '../../components/common/ErrorMessage';  
import { useAuthContext } from '../../context/AuthContext';  
import Footer from '../../components/common/Footer';

const LoginPage: React.FC = () => {  
  const router = useRouter();  
  const { loginUser, error, clearError, user } = useAuthContext();  
  const [email, setEmail] = useState('');  
  const [password, setPassword] = useState('');  
  const [success, setSuccess] = useState<string | null>(null);  
  const [showLoginMessage, setShowLoginMessage] = useState(false);  

  useEffect(() => {  
    if (user) {  
      setShowLoginMessage(true);  
      const timer = setTimeout(() => {  
        router.push('/news');  
      }, 3000);  
      return () => clearTimeout(timer);  
    }  
  }, [user, router]);  

  useEffect(() => {  
    if (error) {  
      console.log("Error state changed:", error);  
    }  
  }, [error]);  

  const handleLogin = async (e: React.FormEvent) => {  
    e.preventDefault();  
    setSuccess(null);  
    clearError();  

    try {  
      const loginSucceeded = await loginUser(email, password);  
      if (loginSucceeded) {  
        setSuccess('登入成功！');  
        setTimeout(() => {  
          router.push('/news');  
        }, 2500);  
      }  
    } catch (err: any) {  
      console.log("Log in failed, error message set", err.message || err);  
      clearError();  
    }  
  };  

  const errorMessage = (error: string): string => {  
    console.log("Processing error:", error);  
    if (error.includes("User is not confirmed")) {  
      return "您的帳戶尚未確認，請點擊忘記密碼重新驗證。";  
    }  
    if (error.includes("Incorrect username or password")) {  
      return "請確認您的電子郵件和密碼是否正確。";  
    }  
    return "登入失敗，請重試。";  
  };  

  return (  
    <div className="flex flex-col min-h-screen bg-gray-100">  
      <Navbar />  
      <div className="flex items-center justify-center flex-grow">  
        {showLoginMessage ? ( 
          <div className="text-center py-10">
            <h2 className="text-2xl font-semibold text-green-600">您已登入成功!</h2>
            <p className="text-lg text-gray-700">重新導向至其他頁面...</p>
          </div>
        ) : ( 
          <form className="bg-white p-10 rounded-lg shadow-xl w-96" onSubmit={handleLogin}>  
            <h2 className="text-3xl font-semibold mb-6 text-center text-gray-800">登入</h2>  
            <div className="mb-4">  
              <label htmlFor="email" className="text-base text-gray-700">電子郵件</label>  
              <Input  
                id="email"  
                name="email"  
                type="email"  
                placeholder="@metaage.com.tw"  
                value={email}  
                onChange={(e) => setEmail(e.target.value)}  
                required  
                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"  
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
                className="border border-gray-300 p-2 rounded mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"  
              />  
            </div>  
            {error && <ErrorMessage message={errorMessage(error)} />}  
            {success && <div className="text-green-500 mb-5 bg-green-100 p-2 rounded">{success}</div>}  
            <button  
              type="submit"  
              className="bg-blue-600 text-white rounded w-full py-3 hover:bg-blue-700 transition duration-150 mb-4 shadow-md"  
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
                <span className="bg-green-600 text-white rounded w-full py-3 inline-block text-center hover:bg-green-700 transition duration-150 cursor-pointer shadow-md">  
                  註冊  
                </span>  
              </Link>  
            </div>  
          </form>  
        )}
      </div>  
      <Footer />  
    </div>  
  );  
};  

export default LoginPage;