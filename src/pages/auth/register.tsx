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
import Alert from '@/components/common/Alert';

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
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const MAX_VERIFICATION_ATTEMPTS = 3;

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
    let isHandlingRoute = false;  // 防止重複處理

    const handleRouteChange = async (url: string) => {
      if (isRegistrationInProcess && !isHandlingRoute && !success) {
        isHandlingRoute = true;
        
        const message = isVerificationNeeded 
          ? '驗證碼驗證進行中，確定要離開此頁面嗎？'
          : '註冊尚未完成，確定要離開此頁面嗎？';
          
        const userConfirmed = window.confirm(message);
        
        if (!userConfirmed) {
          router.events.emit('routeChangeError');
          // 使用 setTimeout 來避免可能的路由競態條件
          setTimeout(() => {
            router.replace(router.asPath).then(() => {
              isHandlingRoute = false;
            });
          }, 0);
          throw 'Route change aborted';
        } else {
          // 用戶確認離開時才清理
          if (isVerificationNeeded && registrationData?.email) {
            await cleanupUnverifiedUser(registrationData.email);
          }
        }
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [isRegistrationInProcess, isVerificationNeeded, registrationData, router, success]);

  // 修改瀏覽器關閉/刷新處理
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRegistrationInProcess) {
        e.preventDefault();
        e.returnValue = '';
        
        if (isVerificationNeeded && registrationData?.email) {
          cleanupUnverifiedUser(registrationData.email);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRegistrationInProcess, isVerificationNeeded, registrationData]);

  // 修改計時器效果
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // 當計時器到達 0 時，清理未驗證用戶
            if (registrationData?.email) {
              cleanupUnverifiedUser(registrationData.email);
            }
            
            setTimerActive(false);
            setIsVerificationNeeded(false);
            setRegistrationData(null);
            setRegistrationInProgress(false);
            setError("驗證碼已過期，請重新註冊");
            setSuccess(null);
            setVerificationCode('');
            setLocalUsername('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerActive, timeLeft, registrationData]);

  useEffect(() => {
    return () => {
      // 組件卸載時，如果還在驗證階段就清理
      if (isVerificationNeeded && registrationData?.email) {
        cleanupUnverifiedUser(registrationData.email);
      }
    };
  }, [isVerificationNeeded, registrationData]);

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
    // 如果要基本的電子郵件格式驗證，可以使用以下正則表達式
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

        // 5秒後清除成功訊息
        setTimeout(() => {
          setSuccess(null);
        }, 5000);
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
        setError('提供的參數無效。');
      } else {
        setError(err.message || '註冊失敗，請稍後再試。');
      }
      setSuccess(null);  
    }     
  };  

  const handleVerifyCode = async (e: React.FormEvent) => {  
    e.preventDefault();  
    
    // 首先檢查驗證碼是否過期
    if (timeLeft <= 0) {
      setError('驗證碼已過期，請重新註冊');
      setIsVerificationNeeded(false);
      return;
    }

    // 檢查註冊流程狀態
    if (!registrationData || !registrationInProgress) {
      setError('註冊流程已中斷，請重新註冊');
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
        setSuccess('註冊成功，請重新登入！');  
        setError(null);  
        setTimeout(() => {  
          router.push('/auth/login');  
        }, 3000);  
      }
    } catch (err: any) {  
      // 驗證碼錯誤的處理
      if (err.message.includes('Invalid verification code provided')) {  
        const newAttempts = verificationAttempts + 1;
        setVerificationAttempts(newAttempts);
        
        if (newAttempts >= MAX_VERIFICATION_ATTEMPTS) {
          // 顯示錯誤訊息
          setError('驗證碼輸入錯誤次數過多，請重新註冊');
          
          // 清理未驗證的用戶
          if (registrationData?.email) {
            await cleanupUnverifiedUser(registrationData.email);
          }
          
          // 重置各種狀態...
        } else {
          // 還有剩餘嘗試次數
          setError(`驗證碼錯誤，請重新輸入。剩餘 ${MAX_VERIFICATION_ATTEMPTS - newAttempts} 次機會`);
        }
      } else if (err.message.includes('Invalid code provided, please request a code again')) {
        setError('驗證碼無效，請重新獲取驗證碼');
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
      setSuccess('驗證碼已重新發送至您的電子信箱。');  
      setError(null);  
      setVerificationAttempts(0); // 重置嘗試次數
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

            {error && <Alert message={error} type="error" />}
            {success && <Alert message={success} type="success" />}

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