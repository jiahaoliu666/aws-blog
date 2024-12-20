import React, { useState, useEffect } from 'react';  
import { CognitoIdentityProviderClient, ForgotPasswordCommand, ConfirmForgotPasswordCommand, AdminGetUserCommand } from "@aws-sdk/client-cognito-identity-provider";  
import cognitoClient from '@/utils/cognitoClient';  
import '@aws-amplify/ui-react/styles.css';  
import Link from 'next/link';  
import Navbar from '@/components/common/Navbar';  
import Footer from '@/components/common/Footer';  
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { Loader } from '@aws-amplify/ui-react';
import Alert from '@/components/common/Alert';


const ForgotPasswordPage: React.FC = () => {  
  const [email, setEmail] = useState('');  
  
  const [verificationCode, setVerificationCode] = useState('');  
  const [newPassword, setNewPassword] = useState('');  
  const [step, setStep] = useState<'request' | 'reset'>('request');  
  const [error, setError] = useState<string | null>(null);  
  const [success, setSuccess] = useState<string | null>(null);  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true); // 初始設為 true
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5分鐘 = 300秒
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const MAX_VERIFICATION_ATTEMPTS = 3;

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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            setStep('request');
            setError("驗證碼已過期，請重新發送");
            setSuccess(null);
            setVerificationCode('');
            setNewPassword('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerActive, timeLeft]);

  const handleRequestReset = async (e: React.FormEvent) => {  
    e.preventDefault();  
    
    try {
      // 檢查用戶是否存在
      try {
        const getUserCommand = new AdminGetUserCommand({
          UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
          Username: email
        });
        const userResponse = await cognitoClient.send(getUserCommand);
        
        // 檢查用戶狀態
        if (userResponse.UserStatus === 'UNCONFIRMED') {
          // 尋找用戶的 name 屬性
          const nameAttribute = userResponse.UserAttributes?.find(
            attr => attr.Name === 'name'
          );
          
          if (nameAttribute?.Value) {
            // 立即更新輸入框的值
            await setEmail(nameAttribute.Value || ''); // 確保 setEmail 接收到的是 string 類型
            console.log("Setting email to name attribute:", nameAttribute.Value);
            
            // 強制重新渲染輸入框
            setTimeout(() => {
              const emailInput = document.getElementById('email') as HTMLInputElement;
              if (emailInput) {
                emailInput.value = nameAttribute.Value || ''; // 確保 input.value 接收到的是 string 類型
              }
            }, 0);
          }
          
          setError('此電子郵件已被註冊但未驗證。請點擊重新發送驗證碼按鈕進行驗證。');
          return;
        }
        console.log("User status:", userResponse.UserStatus);
      } catch (err: any) {
        console.error("User check error:", err);
        if (err.name === 'UserNotFoundException') {
          setError('此電子郵件尚未註冊');
          return;
        }
        throw err;
      }

      console.log("Starting password reset flow...");
      const command = new ForgotPasswordCommand({  
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
        Username: email,
      });  

      const response = await cognitoClient.send(command);
      console.log("Full API response:", JSON.stringify(response, null, 2));

      if (response.CodeDeliveryDetails) {
        console.log("Delivery details:", {
          medium: response.CodeDeliveryDetails.DeliveryMedium,
          destination: response.CodeDeliveryDetails.Destination,
          attribute: response.CodeDeliveryDetails.AttributeName
        });
      }

      setStep('reset');
      setTimeLeft(300); // 重置計時器
      setTimerActive(true); // 啟動計時器
      setVerificationAttempts(0); // 重置嘗試次數
      setError(null); // 先清除錯誤消息
      setSuccess('驗證碼已發送至您的電子郵件，請在5分鐘內完成驗證');

      // 5秒後自動清除成功消息
      setTimeout(() => {
        setSuccess(null);
      }, 5000);

    } catch (err) {
      const errorName = (err as { name: string }).name; // 使用類型斷言
      console.error("Detailed error:", err);
      
      // 更詳細的錯誤處理
      const errorMessage = {
        UserNotFoundException: '此電子郵件尚未註冊',
        LimitExceededException: '嘗試次數過多，請稍後再試',
        InvalidParameterException: '無效的電子郵件地址',
        CodeDeliveryFailureException: '驗證碼發送失敗',
        NotAuthorizedException: '操作未授權，請確認帳號狀態',
        TooManyRequestsException: '請求過於頻繁，請稍後再試'
      }[errorName] || '發送重置密碼郵件時發生錯誤';

      setError(`${errorMessage} (${errorName})`);
      setSuccess(null);
    }
  };  

  const handleResetPassword = async (e: React.FormEvent) => {  
    e.preventDefault();  
    console.log("Attempting to reset password for email:", email);  

    // 檢查驗證碼是否過期
    if (timeLeft <= 0) {
      setSuccess(null); // 清除任何成功消息
      setError('驗證碼已過期，請重新發送');
      setStep('request');
      return;
    }

    try {  
      const command = new ConfirmForgotPasswordCommand({  
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
        Username: email,  
        ConfirmationCode: verificationCode,  
        Password: newPassword,  
      });  
      
      const response = await cognitoClient.send(command);  
      console.log("ConfirmForgotPasswordCommand response:", response);  
      setError(null);
      setSuccess('密碼重置成功，您的帳戶已驗證。請用新密碼登入。');
      setVerificationAttempts(0); // 重置嘗試次數

      setTimeout(() => {
        setSuccess(null);
      }, 5000);

      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 3000);
    } catch (err: any) {  
      console.error("Error during ConfirmForgotPasswordCommand:", err);  
      
      // 處理驗證碼錯誤
      if (err.message.includes('Invalid verification code provided')) {
        const newAttempts = verificationAttempts + 1;
        setVerificationAttempts(newAttempts);
        
        if (newAttempts >= MAX_VERIFICATION_ATTEMPTS) {
          setError('驗證碼輸入錯誤次數過多，請重新發送驗證碼');
          
          // 重置所有相關狀態
          setTimerActive(false);
          setStep('request');
          setVerificationCode('');
          setNewPassword('');
          setTimeLeft(300);
          setVerificationAttempts(0);
          
          // 延遲 3 秒後重新載入頁面
          setTimeout(() => {
            window.location.reload();
          }, 3000);
          return;
        } else {
          setError(`驗證碼錯誤，請重新輸入。剩餘 ${MAX_VERIFICATION_ATTEMPTS - newAttempts} 次機會`);
        }
      } else if (err.message.includes('Password does not conform to policy')) {
        const missingRequirements = [];
        
        if (newPassword.length < 8) {
          missingRequirements.push('• 密碼長度至少需要8個字符');
        }
        if (!/[A-Z]/.test(newPassword)) {
          missingRequirements.push('• 需要至少1個大寫字母');
        }
        if (!/[a-z]/.test(newPassword)) {
          missingRequirements.push('• 需要至少1個小寫字母');
        }
        if (!/[0-9]/.test(newPassword)) {
          missingRequirements.push('• 需要至少1個數字');
        }
        if (!/[!@#$%^&*]/.test(newPassword)) {
          missingRequirements.push('• 需要至少1個特殊符號');
        }

        setError(`密碼格式不符合要求：\n${missingRequirements.join('\n')}`);
      } else if (err.message.includes('Invalid code provided')) {
        setError('驗證碼無效，請重新請求驗證碼');
      } else if (err.message.includes('Attempt limit exceeded')) {
        setError('已超過嘗試次數限制，請稍後再試');
        
        // 重置所有相關狀態
        setTimerActive(false);
        setStep('request');
        setVerificationCode('');
        setNewPassword('');
        setTimeLeft(300);
        setVerificationAttempts(0);
        
        // 延遲 3 秒後重新載入頁面
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {  
        setError(err.message || '重置密碼失敗');  
      }  
      setSuccess(null);  
    }  
  };  

  return (  
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-100 to-gray-300">  
      <Navbar />  
      <div className="flex items-center justify-center flex-grow px-4 py-8">  
        {loading ? (
          <Loader className="mb-4" size="large" />
        ) : (
          <form className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200" onSubmit={step === 'request' ? handleRequestReset : handleResetPassword} style={{ backdropFilter: 'blur(15px)', backgroundColor: 'rgba(255, 255, 255, 0.85)' }}>  
            <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800">忘記密碼</h2>  
            <div className="mb-4 relative">  
              <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input  
                id="email"  
                name="email"  
                type="email"  
                placeholder="@metaage.com.tw"  
                value={email}  
                onChange={(e) => setEmail(e.target.value)}  
                required  
                className="border border-gray-300 p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full transition duration-150 ease-in-out text-gray-700"  
                disabled={step === 'reset'}  
              />  
            </div>  

            {step === 'reset' && (  
              <>  
                <div className="mb-4 relative">  
                  <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input  
                    id="newPassword"  
                    name="newPassword"  
                    type={showPassword ? "text" : "password"}  
                    placeholder="輸入新密碼"  
                    value={newPassword}  
                    onChange={(e) => setNewPassword(e.target.value)}  
                    required  
                    className="border border-gray-300 p-3 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full transition duration-150 ease-in-out text-gray-700"  
                  />  
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? "隱藏" : "顯示"}
                  </button>
                </div>  
                <div className="mb-4">  
                  <label htmlFor="verificationCode" className="text-base text-gray-700 mb-2 block">驗證碼</label>  
                  <input  
                    id="verificationCode"  
                    name="verificationCode"  
                    type="text"  
                    placeholder="輸入驗證碼"  
                    value={verificationCode}  
                    onChange={(e) => setVerificationCode(e.target.value)}  
                    required  
                    className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-gray-700"  
                  />  
                </div>  
                <div className="text-center mt-6 mb-4">
                  <p className="bg-blue-50 text-blue-700 p-3 rounded-lg shadow-sm border border-blue-200 font-medium">
                    驗證碼有效時間：
                    <span className="ml-2 text-lg font-bold">
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </p>
                </div>
              </>  
            )}  

            {error && <Alert message={error} type="error" />}
            {success && <Alert message={success} type="success" />}

            <div className="mt-6">  
              <button  
                type="submit"  
                className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-full w-full py-3 hover:from-blue-600 hover:to-blue-800 transition duration-200 ease-in-out mb-4 shadow-xl transform hover:scale-105"  
              >  
                {step === 'request' ? '發送驗證碼' : '重置密碼'}  
              </button>  
            </div>

            <div className="mt-4 text-center">  
              <Link href="/auth/login">  
                <span className="text-blue-500 hover:underline">返回登入</span>  
              </Link>  
            </div>  
          </form>  
        )}
      </div>  
      <Footer />  
    </div>  
  );  
};  

export default ForgotPasswordPage;
