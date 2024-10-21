import React, { useState } from 'react';  
import { CognitoIdentityProviderClient, ForgotPasswordCommand, ConfirmForgotPasswordCommand } from "@aws-sdk/client-cognito-identity-provider";  
import cognitoClient from '@/utils/cognitoClient';  
import '@aws-amplify/ui-react/styles.css';  
import Link from 'next/link';  
import Navbar from '@/components/common/Navbar';  // 導入 Navbar
import Footer from '@/components/common/Footer';  // 導入 Footer

const ForgotPasswordPage: React.FC = () => {  
  const [email, setEmail] = useState('');  
  const [verificationCode, setVerificationCode] = useState('');  
  const [newPassword, setNewPassword] = useState('');  
  const [step, setStep] = useState<'request' | 'reset'>('request');  
  const [error, setError] = useState<string | null>(null);  
  const [success, setSuccess] = useState<string | null>(null);  

  const handleRequestReset = async (e: React.FormEvent) => {  
    e.preventDefault();  
    console.log("Initiating password reset request for email:", email);  

    try {  
      const command = new ForgotPasswordCommand({  
        ClientId: "5ua9kmb59lmqks0echkc261dgh",  
        Username: email,  
      });  
      await cognitoClient.send(command);  
      setStep('reset');  
      setSuccess('驗證碼已發送至您的電子郵件。');  
      setError(null);  
    } catch (err: any) {  
      console.error("Error during ForgotPasswordCommand:", err);  
      if (err.name === 'UserNotFoundException' || err.code === 'UserNotFoundException') {  
        setError('此電子郵件尚未註冊。');  
      } else if (err.message.includes('Attempt limit exceeded, please try after some time')) {  
        setError('嘗試次數過多，請稍後再試。');  
      } else {  
        setError(err.message || '請求重置密碼失敗');  
      }  
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
      setSuccess('密碼重置成功，您的帳戶已驗證。請用新密碼登入。');  
      setError(null);  
    } catch (err: any) {  
      console.error("Error during ConfirmForgotPasswordCommand:", err);  
      if (err.message.includes('Password does not conform to policy: Password not long enough')) {  
        setError('密碼不符合政策要求：密碼長度不足。');  
      } else {  
        setError(err.message || '重置密碼失敗');  
      }  
      setSuccess(null);  
    }  
  };  

  return (  
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-100 to-gray-300">  
      <Navbar />  {/* 使用 Navbar */}
      <div className="flex items-center justify-center flex-grow px-4 py-8">  
        <form className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200" onSubmit={step === 'request' ? handleRequestReset : handleResetPassword} style={{ backdropFilter: 'blur(15px)', backgroundColor: 'rgba(255, 255, 255, 0.85)' }}>  
          <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800">忘記密碼</h2>  
          <div className="mb-4">  
            <label htmlFor="email" className="text-base text-gray-700 mb-2 block">電子郵件</label>  
            <input  
              id="email"  
              name="email"  
              type="email"  
              placeholder="@metaage.com.tw"  
              value={email}  
              onChange={(e) => setEmail(e.target.value)}  
              required  
              className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"  
              disabled={step === 'reset'}  
            />  
          </div>  

          {step === 'reset' && (  
            <>  
              <div className="mb-4">  
                <label htmlFor="newPassword" className="text-base text-gray-700 mb-2 block">新密碼</label>  
                <input  
                  id="newPassword"  
                  name="newPassword"  
                  type="password"  
                  placeholder="輸入新密碼"  
                  value={newPassword}  
                  onChange={(e) => setNewPassword(e.target.value)}  
                  required  
                  className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"  
                />  
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
                  className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"  
                />  
              </div>  
            </>  
          )}  

          {error && <div className="text-red-500 mb-5 bg-red-100 p-2 rounded">{error}</div>}  
          {success && <div className="text-green-500 mb-5 bg-green-100 p-2 rounded">{success}</div>}  

          <div className="mt-6">  {/* 添加間距 */}
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
      </div>  
      <Footer />  {/* 使用 Footer */}
    </div>  
  );  
};  

export default ForgotPasswordPage;
