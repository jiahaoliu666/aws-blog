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


const ForgotPasswordPage: React.FC = () => {  
  const [email, setEmail] = useState('');  
  
  const [verificationCode, setVerificationCode] = useState('');  
  const [newPassword, setNewPassword] = useState('');  
  const [step, setStep] = useState<'request' | 'reset'>('request');  
  const [error, setError] = useState<string | null>(null);  
  const [success, setSuccess] = useState<string | null>(null);  
  const [showPassword, setShowPassword] = useState(false);
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

  const handleRequestReset = async (e: React.FormEvent) => {  
    e.preventDefault();  
    
    try {
      // 檢查用戶是否存在
      try {
        const getUserCommand = new AdminGetUserCommand({
          UserPoolId: "ap-northeast-1_SDMioGwSr",
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
        ClientId: "5ua9kmb59lmqks0echkc261dgh",  
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
      setSuccess('驗證碼已發送至您的電子郵件，請檢查收件匣和垃圾郵件匣。');
      setError(null);

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

    try {  
      const command = new ConfirmForgotPasswordCommand({  
        ClientId: "5ua9kmb59lmqks0echkc261dgh",  
        Username: email,  
        ConfirmationCode: verificationCode,  
        Password: newPassword,  
      });  
      const response = await cognitoClient.send(command);  
      console.log("ConfirmForgotPasswordCommand response:", response);  
      setSuccess('密碼���置成功，您的帳戶已驗證。請用新密碼登入。');  
      setError(null);

      // 增重定向邏輯
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 3000);
    } catch (err: any) {  
      console.error("Error during ConfirmForgotPasswordCommand:", err);  
      if (err.message.includes('Password does not conform to policy: Password not long enough')) {  
        setError('密碼不符合政策要求：密碼長度不足。');  
      } else if (err.message.includes('Invalid verification code provided, please try again.')) {
        setError('請提供正確的驗證碼。');
      } else if (err.message.includes('Invalid code provided, please request a code again.')) {
        setError('驗證碼無效，請重新請求驗證碼。');
      } else if (err.message.includes('Attempt limit exceeded, please try after some time.')) {
        setError('嘗試次數過多，請稍後再試。');
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
              </>  
            )}  

            {error && (
              <div className={`mt-4 mb-6 p-4 rounded-lg shadow-md ${error.includes('成功') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 mb-6 p-4 rounded-lg shadow-md bg-green-100 text-green-800">
                {success}
              </div>
            )}

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
