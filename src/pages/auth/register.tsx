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
import axios from 'axios';

const logger = {
  info: (message: string, data?: any) => console.info(message, data),
  error: (message: string, data?: any) => console.error(message, data),
};

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
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5分鐘 = 300秒
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [registrationData, setRegistrationData] = useState<{
    email: string;
    password: string;
    username: string;
    tempUserSub?: string;
  } | null>(null);
  const [registrationInProgress, setRegistrationInProgress] = useState(false);
  const [isRegistrationInProcess, setIsRegistrationInProcess] = useState(false);

  useEffect(() => {
    const checkIfLoadingIsNeeded = async () => {
      // 定義 someLoadingCondition 函數
      const someLoadingCondition = async () => {
        // 這裡可以放置的邏輯，例如檢查某個 API 狀態
        return false; // 假設不需
      };

      const needsLoading = await someLoadingCondition();
      setLoading(needsLoading);
    };

    checkIfLoadingIsNeeded();
  }, []);

  // 檢查是否有輸入值的函數
  const hasInputValues = () => {
    if (isVerificationNeeded) {
      return verificationCode !== '';
    }
    return username !== '' || email !== '' || password !== '' || confirmPassword !== '';
  };

  // 監聽輸入值變化
  useEffect(() => {
    // 當有任何輸入值時，設置註冊流程狀態為 true
    setIsRegistrationInProcess(hasInputValues());
  }, [username, email, password, confirmPassword, verificationCode]);

  // 修改路由變更處理
  useEffect(() => {
    let isHandlingRoute = false;  // 添加標記來追蹤是否正在處理路由變更

    const handleRouteChange = async (url: string) => {
      if (isRegistrationInProcess && !isHandlingRoute) {
        isHandlingRoute = true;  // 設置標記
        
        const userConfirmed = window.confirm('註冊流程進行中，確定要離開此頁面嗎？');
        
        if (!userConfirmed) {
          router.events.emit('routeChangeError');
          // 使用 setTimeout 來確保路由完全重置
          setTimeout(() => {
            router.replace(router.asPath).then(() => {
              isHandlingRoute = false;  // 重置標記
            });
          }, 0);
          throw 'Route change aborted';
        }
        
        isHandlingRoute = false;  // 重置標記
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [isRegistrationInProcess]);

  // 處理瀏覽器關閉/刷新
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasInputValues()) {
        if (isVerificationNeeded && registrationData?.tempUserSub) {
          // 在這裡我們無法執行異步操作，但可以標記註冊流程已中斷
          setRegistrationInProgress(false);
          setIsVerificationNeeded(false);
          setRegistrationData(null);
        }
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [username, email, password, confirmPassword, verificationCode, isVerificationNeeded, registrationData]);

  // 修改計時器效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // 當計時器到達 0 時
            setTimerActive(false);
            setIsVerificationNeeded(false);
            setRegistrationData(null);
            setRegistrationInProgress(false); // 確保註冊流程被中斷
            setError("驗證碼已過期，請重新註冊");
            setSuccess(null);
            
            // 清除驗證碼輸入
            setVerificationCode('');
            
            // 清除所有表單數據並返回註冊狀態
            setLocalUsername('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            
            // 3秒後清除錯誤訊息並重置表單狀態
            setTimeout(() => {
              setError(null);
              // 這裡不需要再次設置 setIsVerificationNeeded(false)
              // 因為上面已經設置過了，這確保了用戶會看到註冊表單
            }, 3000);
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerActive, timeLeft]);

  const handleRegister = async (e: React.FormEvent) => {  
    e.preventDefault();  
    setRegistrationInProgress(true);

    // 檢查用戶名長度
    if (username.length > 10) {
      setError('用戶名不可超過10個字');
      setSuccess(null);
      return;
    }

    // 移除 @metaage.com.tw 的驗證
    // 如果���要基本的電子郵件格式驗證，可以使用以下正則表達式
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError('請��入有效的電子郵件地址');
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

      const signUpResponse = await cognitoClient.send(command);
      
      if (signUpResponse.UserSub) {
        setRegistrationData({
          email,
          password,
          username,
          tempUserSub: signUpResponse.UserSub
        });
        setIsVerificationNeeded(true);
        setTimeLeft(300);
        setTimerActive(true);
        setSuccess('已發送驗證碼，請在5分鐘內完成驗證');
        setError(null);
      }

    } catch (err: any) {  
      console.log('進入 catch 區塊');
      console.error('註冊失敗:', err);
      if (err.name === 'UsernameExistsException') {
        setError(`電子郵件 ${email} 已被註冊，請使用其他電子郵件。`);
        const userConfirmed = await checkUserConfirmationStatus(email);
        if (userConfirmed) {
          setError(`此 ${email} 郵件地址已註冊，請直接登入...`);
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
    
    // 檢查是否已過期或註冊流程已中斷
    if (!registrationData || !registrationInProgress || timeLeft <= 0) {
      setError('驗證碼已過期或註冊流程已中斷，請重新註冊');
      setIsVerificationNeeded(false);
      return;
    }

    try {  
      const command = new ConfirmSignUpCommand({  
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,  
        Username: registrationData.email,  
        ConfirmationCode: verificationCode,  
      });  
      await cognitoClient.send(command);  
      
      // 驗證成功後才創建用戶資料
      if (registrationData.tempUserSub && registrationInProgress) {
        await userApi.handlePostRegistration(registrationData.tempUserSub);
        setTimerActive(false);
        setSuccess('註冊成功！請重新登入！');  
        setError(null);  
        setTimeout(() => {  
          router.push('/auth/login');  
        }, 3000);  
      }
    } catch (err: any) {  
      if (err.message.includes('Invalid verification code provided')) {  
        setError('提供的驗證碼無效，請再一次。');  
      } else {  
        setError(err.message || '驗證失敗');  
      }  
      setSuccess(null);  
    }  
    setRegistrationInProgress(false);
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

  const cleanupUnverifiedUser = async (email: string) => {
    try {
      // 調用後端 API 刪除未驗證的用戶
      await axios.post('/api/auth/cleanup', { email });
      logger.info('成功清理未驗證用戶', { email });
    } catch (error) {
      logger.error('清理未驗證用戶失敗', { error, email });
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

            {isVerificationNeeded && (
              <div className="text-center mt-6 mb-4">
                <p className="bg-blue-50 text-blue-700 p-3 rounded-lg shadow-sm border border-blue-200 font-medium">
                  驗證碼有效時間：
                  <span className="ml-2 text-lg font-bold">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </p>
              </div>
            )}
          </form>  
        )}
      </div>  
      <Footer />  
    </div>  
  );  
};  

export default RegisterPage;
