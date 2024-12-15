// src/pages/auth/register.tsx  
import React, { useState, useEffect } from 'react';  
import { ConfirmSignUpCommand, ResendConfirmationCodeCommand, SignUpCommand, AdminGetUserCommand } from "@aws-sdk/client-cognito-identity-provider";  
import cognitoClient from '@/utils/cognitoClient';  
import { PasswordField, Input } from '@aws-amplify/ui-react';  
import '@aws-amplify/ui-react/styles.css';  
import Link from 'next/link';  
import { useRouter } from 'next/router';  
import Navbar from '@/components/common/Navbar';  
import Footer from '@/components/common/Footer';  
import { useAuthContext } from '@/context/AuthContext';  
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { Loader } from '@aws-amplify/ui-react';
import { userApi } from '@/api/user';


const RegisterPage: React.FC = () => {  
  const router = useRouter();  
  const { registerUser } = useAuthContext();  

  const [username, setLocalUsername] = useState('');  
  const [email, setEmail] = useState('');  
  const [password, setPassword] = useState('');  
  const [confirmPassword, setConfirmPassword] = useState('');  
  const [verificationCode, setVerificationCode] = useState('');  
  const [error, setError] = useState<string | null>(null);  
  const [success, setSuccess] = useState<string | null>(null);  
  const [isVerificationNeeded, setIsVerificationNeeded] = useState(false);  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true); // 初始設為 true

  useEffect(() => {
    const checkIfLoadingIsNeeded = async () => {
      // 定義 someLoadingCondition 函數
      const someLoadingCondition = async () => {
        // 這裡可以放置你的邏輯，例如檢查某個 API 狀態
        return false; // 假設不需要載入
      };

      const needsLoading = await someLoadingCondition();
      setLoading(needsLoading);
    };

    checkIfLoadingIsNeeded();
  }, []);

  // 檢查是否有輸入值的函數
  const hasInputValues = () => {
    return username !== '' || email !== '' || password !== '' || confirmPassword !== '';
  };

  // 處理路由變更
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (hasInputValues() && !isVerificationNeeded) {
        const confirm = window.confirm('您尚未完成註冊流程，確��要離開此頁面嗎？');
        if (!confirm) {
          router.events.emit('routeChangeError');
          throw 'Route change aborted';
        }
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [username, email, password, confirmPassword, isVerificationNeeded]);

  // 處理瀏覽器關閉/刷新
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasInputValues() && !isVerificationNeeded) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [username, email, password, confirmPassword, isVerificationNeeded]);

  const handleRegister = async (e: React.FormEvent) => {  
    e.preventDefault();  

    // 檢查用戶名長度
    if (username.length > 10) {
      setError('用戶名不可超過10個字');
      setSuccess(null);
      return;
    }

    // 移除 @metaage.com.tw 的驗證
    // 如果需要基本的電子郵件格式驗證，可以使用以下正則表達式
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError('請輸入有效的電子郵件地址');
      setSuccess(null);
      return;
    }

    const invalidCharactersPattern = /[^a-zA-Z0-9\u4e00-\u9fff]/;  
    if (invalidCharactersPattern.test(username)) {  
      setError('用戶名僅允許英文、繁體、數字，不可包含特殊字符');  
      setSuccess(null);  
      return;  
    }  

    if (password !== confirmPassword) {  
      setError('密碼不匹配，請重新輸入');  
      setSuccess(null);  
      return;  
    }  

    try {  
      const command = new SignUpCommand({
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
        Username: email,
        Password: password,
        UserAttributes: [
          {
            Name: "email",
            Value: email
          },
          {
            Name: "name",
            Value: username
          }
        ]
      });

      // 註冊 Cognito 用戶
      const signUpResponse = await cognitoClient.send(command);
      
      // 如果註冊成功，取得 sub 並創建用戶資料
      if (signUpResponse.UserSub) {
        try {
          await userApi.handlePostRegistration(signUpResponse.UserSub);
          setSuccess('註冊成功！請檢查您的電子郵件以驗證您的帳戶。');  
          setError(null);  
          setIsVerificationNeeded(true);
        } catch (err) {
          console.error('創建用戶資料失敗:', err);
          setSuccess('註冊成功！請檢查您的電子郵件以驗證您的帳戶。但用戶資料初始化失敗，請稍後在個人資料頁面重新註冊。');  
          setError(null);  
          setIsVerificationNeeded(true);
        }
      }

    } catch (err: any) {  
      console.log('進入 catch 區塊');
      console.error('註冊失敗:', err);
      if (err.name === 'UsernameExistsException') {
        setError(`電子郵件 ${email} 已被註冊，請使用其他電子郵件。`);
        const userConfirmed = await checkUserConfirmationStatus(email);
        if (userConfirmed) {
          setError(`電子郵件 ${email} 已被註冊且已驗證，請直接登入...`);
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        } else {
          setError(`電子郵件 ${email} 已被註冊但未驗證。請點擊重新發送驗證碼按鈕進行驗證。`);
          setIsVerificationNeeded(true);
        }
      } else if (err.name === 'InvalidPasswordException') {
        const missingRequirements = [];
        
        if (password.length < 8) {
          missingRequirements.push('• 密碼長度至少需要8個字符');
        }
        if (!/[A-Z]/.test(password)) {
          missingRequirements.push('• 需要至少1個大寫字母');
        }
        if (!/[a-z]/.test(password)) {
          missingRequirements.push('• 需要至少1個小寫字母');
        }
        if (!/[0-9]/.test(password)) {
          missingRequirements.push('• 需要至少1個數字');
        }
        if (!/[!@#$%^&*]/.test(password)) {
          missingRequirements.push('• 需要至少1個特殊符號');
        }

        setError(`密碼格式不符合要求，缺少：\n${missingRequirements.join('\n')}`);
      } else if (err.name === 'InvalidParameterException') {
        setError('提供的參數無效，請檢查您的輸入。');
      } else {
        setError(err.message || '註冊失敗，請稍後再試。');
      }
      setSuccess(null);  
    }  
  };  

  const handleVerifyCode = async (e: React.FormEvent) => {  
    e.preventDefault();  
    try {  
      const command = new ConfirmSignUpCommand({  
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,  
        Username: email,  
        ConfirmationCode: verificationCode,  
      });  
      await cognitoClient.send(command);  
      setSuccess('驗證成功，請重新登入！');  
      setError(null);  
      setTimeout(() => {  
        router.push('/auth/login');  
      }, 3000);  
    } catch (err: any) {  
      if (err.message.includes('Invalid verification code provided')) {  
        setError('提供的驗證碼無效，請再試一次。');  
      } else {  
        setError(err.message || '驗證失敗');  
      }  
      setSuccess(null);  
    }  
  };  

  const handleResendCode = async () => {  
    try {  
      const command = new ResendConfirmationCodeCommand({  
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,  
        Username: email  
      });  
      await cognitoClient.send(command);  
      setSuccess('驗證碼已重新發送至您的電子郵件。');  
      setError(null);  
    } catch (err: any) {  
      setError(err.message || '重發驗證碼失敗');  
      setSuccess(null);  
    }  
  };  

  // 新增檢查用戶確認狀的函數
  const checkUserConfirmationStatus = async (email: string) => {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
        Username: email
      });
      const response = await cognitoClient.send(command);
      console.log('UserStatus:', response.UserStatus); // 添加這行以檢查 response 的結構
      return response.UserStatus === "CONFIRMED";
    } catch (err) {
      console.error('檢查用戶確認狀態失敗:', err);
      return false;
    }
  };

  return (  
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-100 to-gray-300">  
      <Navbar />  
      <div className="flex items-center justify-center flex-grow px-4 py-8">  
        {loading ? (
          <Loader className="mb-4" size="large" />
        ) : (
          <form className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200" onSubmit={isVerificationNeeded ? handleVerifyCode : handleRegister} style={{ backdropFilter: 'blur(15px)', backgroundColor: 'rgba(255, 255, 255, 0.85)' }}>  
            <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800">註冊</h2>  

            <div className="mb-2 relative">
              <FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 transform -translate-y-1/3 text-gray-500" />
              <input
                id="username"
                name="username"
                type="text"
                placeholder="輸入用戶名"
                value={username}
                onChange={(e) => setLocalUsername(e.target.value)}
                required
                maxLength={10}
                className="border border-gray-300 p-3 pl-10 pr-16 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full transition duration-150 ease-in-out text-gray-700"
                disabled={isVerificationNeeded}
                style={{ marginTop: '8px' }}
              />
              {username.length > 0 && (
                <span className="absolute right-3 top-1/2 transform -translate-y-1/3 text-gray-500 text-sm">
                  {username.length}/10
                </span>
              )}
            </div>  

            <div className="mb-4 relative">
              <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 transform -translate-y-1/4 text-gray-500" />
              <input
                id="email"
                name="email"
                type="text"
                placeholder="@metaage.com.tw"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border border-gray-300 p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full transition duration-150 ease-in-out text-gray-700"
                disabled={isVerificationNeeded}
                style={{ marginTop: '8px' }}
              />
            </div>  

            {!isVerificationNeeded && (  
              <>
                <div className="mb-4 relative">
                  <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    placeholder="輸入密碼"
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

                <div className="mb-6 relative">
                  <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    placeholder="再次輸入密碼"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className="border border-gray-300 p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full transition duration-150 ease-in-out text-gray-700"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? "隱藏" : "顯示"}
                  </button>
                </div>
              </>
            )}  

            {isVerificationNeeded && (  
              <>
                <div className="mb-4 relative">
                  <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/3 text-gray-500" />
                  <input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    placeholder="輸入驗證碼"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                    className="border border-gray-300 p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full transition duration-150 ease-in-out text-gray-700"
                    style={{ marginTop: '8px' }}
                  />
                </div>
                <button
                  type="button"
                  className="text-blue-500 hover:underline mb-4"
                  onClick={handleResendCode}
                >
                  重新發送驗證碼
                </button>
              </>
            )}  

            {error && (
              <div className="mt-4 mb-6 p-4 rounded-lg shadow-md bg-red-100 text-red-800" style={{ whiteSpace: 'pre-line' }}>
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 mb-6 p-4 rounded-lg shadow-md bg-green-100 text-green-800">
                {success}
              </div>
            )}

            <button  
              type="submit"  
              className="bg-gradient-to-r from-green-500 to-green-700 text-white rounded-full w-full py-3 hover:from-green-600 hover:to-green-800 transition duration-200 ease-in-out mb-4 shadow-xl transform hover:scale-105"  
            >  
              {isVerificationNeeded ? '確認驗證' : '註冊'}  
            </button>  

            <div className="mt-4 text-center">  
              <span className="text-gray-700">已經有帳號了？</span>&nbsp;  
              <Link href="/auth/login">  
                <span className="text-blue-500 hover:underline">登入</span>  
              </Link>  
            </div>  
          </form>  
        )}
      </div>  
      <Footer />  
    </div>  
  );  
};  

export default RegisterPage;
