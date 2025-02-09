import React, { useEffect, useState } from 'react';  
import { Input, PasswordField } from '@aws-amplify/ui-react';  
import '@aws-amplify/ui-react/styles.css';  
import Link from 'next/link';  
import { useRouter } from 'next/router';  
import Navbar from '../../components/common/Navbar';  
import { useAuthContext } from '../../context/AuthContext';  
import Footer from '../../components/common/Footer';
import { Loader } from '@aws-amplify/ui-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import logActivity from '../api/profile/activity-log'; // 引入 logActivity 函數
import Alert from '../../components/common/Alert';

const LoginPage: React.FC = () => {  
  const router = useRouter();  
  const { loginUser, error, clearError, user } = useAuthContext();  
  const [email, setEmail] = useState('');  
  const [password, setPassword] = useState('');  
  const [success, setSuccess] = useState<string | null>(null);  
  const [showLoginMessage, setShowLoginMessage] = useState(false);  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true); // 新增 loading 狀態

  useEffect(() => {  
    if (user) {  
      setShowLoginMessage(true);  
      const timer = setTimeout(() => {  
        router.push('/news');  
      }, 3000);  
      return () => clearTimeout(timer);  
    } else {
      setLoading(false); // 如果未登入，停止 loading
    }
    clearError(); // 在頁面加載時清除錯誤
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
        
        // 從 localStorage 取得最新的用戶資訊
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          await logActivity(userData.sub, '登入帳戶');
        }
        
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
      return "您的帳戶尚未確認，請點擊註冊重新驗證。";  
    }  
    if (error.includes("Incorrect username or password")) {  
      return "請確認您的電子郵件和密碼是否正確。";  
    }
    if (error.includes("Password attempts exceeded")) {
      return "密碼嘗試次數超過限制，請稍後再試。";
    }
    return "";  // 移除或返回空字串
  };  

  return (  
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-100 to-gray-300">  
      <Navbar />  
      <div className="flex items-center justify-center flex-grow px-4 py-8">  
        {loading ? (
          <Loader className="mb-4" size="large" />
        ) : showLoginMessage ? ( 
          <div className="text-center py-10">
            <Loader className="mb-4" size="large"/> 
            <h2 className="text-2xl font-semibold text-green-600">您已登入成功!</h2>
            <p className="text-lg text-gray-700">重新導向至其他頁面...</p>
          </div>
        ) : ( 
          <form className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200" onSubmit={handleLogin} style={{ backdropFilter: 'blur(15px)', backgroundColor: 'rgba(255, 255, 255, 0.85)' }}>  
            <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800">登入</h2>  
            <div className="mb-4 relative">
              <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                placeholder="電子郵件地址"
                name="username"
                type="text"
                className="border border-gray-300 p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full transition duration-150 ease-in-out text-gray-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-6 relative">
              <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                placeholder="密碼"
                name="password"
                type={showPassword ? "text" : "password"}
                className="border border-gray-300 p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full transition duration-150 ease-in-out text-gray-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showPassword ? "隱藏" : "顯示"}
              </button>
            </div>
            {error && <Alert message={errorMessage(error)} type="error" />}
            {success && <Alert message={success} type="success" />}
            <button  
              type="submit"  
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-full w-full py-3 hover:from-blue-600 hover:to-blue-800 transition duration-200 ease-in-out mb-4 shadow-xl transform hover:scale-105"  
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
                <span className="bg-green-600 text-white rounded-full w-full py-3 inline-block text-center hover:bg-green-700 transition duration-200 ease-in-out cursor-pointer shadow-lg transform hover:scale-105">  
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
