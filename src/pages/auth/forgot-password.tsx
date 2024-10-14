// src/pages/auth/forgot-password.tsx  
import React, { useState } from 'react';  
import { CognitoIdentityProviderClient, ForgotPasswordCommand, ConfirmForgotPasswordCommand } from "@aws-sdk/client-cognito-identity-provider";  
import cognitoClient from '@/utils/cognitoClient';  
import { Input, Label, Flex, PasswordField } from '@aws-amplify/ui-react';  // 假設 PasswordField 可以被引入  
import '@aws-amplify/ui-react/styles.css';  
import Link from 'next/link';  

const ForgotPasswordPage: React.FC = () => {  
  const [email, setEmail] = useState('');  
  const [verificationCode, setVerificationCode] = useState('');  
  const [newPassword, setNewPassword] = useState('');  
  const [step, setStep] = useState<'request' | 'reset'>('request');  
  const [error, setError] = useState<string | null>(null);  
  const [success, setSuccess] = useState<string | null>(null);  

  const handleRequestReset = async (e: React.FormEvent) => {  
    e.preventDefault();  
    console.log("Initiating password reset request for email:", email);  // Log the email being used  
  
    try {  
      const command = new ForgotPasswordCommand({  
        ClientId: "5ua9kmb59lmqks0echkc261dgh",  
        Username: email,  
      });  

      const response = await cognitoClient.send(command);  
      console.log("ForgotPasswordCommand response:", response);  // Log the response from AWS Cognito  
  
      setSuccess('驗證碼已發送至您的電子郵件。');  
      setError(null);  
      setStep('reset');  
    } catch (err: any) {  
      console.error("Error during ForgotPasswordCommand:", err);  // Log any error encountered  
  
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
    console.log("Attempting to reset password for email:", email);  // Log the email being used  
    console.log("Verification code and new password provided.");  // Ensure both code and password are being captured  

    try {  
      const command = new ConfirmForgotPasswordCommand({  
        ClientId: "5ua9kmb59lmqks0echkc261dgh",  
        Username: email,  
        ConfirmationCode: verificationCode,  
        Password: newPassword,  
      });  

      const response = await cognitoClient.send(command);  
      console.log("ConfirmForgotPasswordCommand response:", response);  // Log the response from AWS Cognito  

      setSuccess('密碼重置成功，您的帳戶已驗證。請使用新密碼登入。');  
      setError(null);  
    } catch (err: any) {  
      console.error("Error during ConfirmForgotPasswordCommand:", err);  // Log any error encountered  
  
      if (err.message.includes('Password does not conform to policy: Password not long enough')) {  
        setError('密碼長度不足，請輸入至少 8 個字符。');  
      } else if (err.message.includes('Attempt limit exceeded, please try after some time')) {  
        setError('嘗試次數過多，請稍後再試。');  
      } else {  
        setError(err.message || '重置密碼失敗');  
      }  
      setSuccess(null);  
    }  
  };  

  return (  
    <div className="flex items-center justify-center min-h-screen bg-gray-200">  
      <form className="bg-white p-10 rounded-lg shadow-lg w-96" onSubmit={step === 'request' ? handleRequestReset : handleResetPassword}>  
        <h2 className="text-3xl font-semibold mb-6 text-center text-gray-800">{step === 'request' ? '忘記密碼' : '重置密碼'}</h2>  

        <Flex direction="column" gap="4" className="mb-4">  
          <Label htmlFor="email" className="text-base text-gray-700">電子郵件</Label>  
          <div className="mb-5">  
            <Input  
              id="email"  
              name="email"  
              type="email"  
              placeholder="@metaage.com.tw"  
              value={email}  
              onChange={(e) => setEmail(e.target.value)}  
              required  
              className="border border-gray-300 p-2 rounded"  
              disabled={step === 'reset'}  
            />  
          </div>  
        </Flex>  

        {step === 'reset' && (  
          <>  
            <div className="mb-4">  
              <PasswordField  
                id="newPassword"  
                name="newPassword"  
                label="新密碼"  // 添加 label 屬性  
                placeholder="輸入新密碼"  
                value={newPassword}  
                onChange={(e) => setNewPassword(e.target.value)}  
                required  
                className="border border-gray-300 p-2 rounded"  
              />  
            </div>  
            <div className="mb-4">  
              <Label htmlFor="verificationCode" className="text-base text-gray-700">驗證碼</Label>  
              <Input  
                id="verificationCode"  
                name="verificationCode"  
                type="text"  
                placeholder="輸入驗證碼"  
                value={verificationCode}  
                onChange={(e) => setVerificationCode(e.target.value)}  
                required  
                className="border border-gray-300 p-2 rounded"  
                style={{ marginTop: '8px' }}  
              />  
            </div>  
          </>  
        )}  

        {error && <div className="text-red-500 mb-5 bg-red-100 p-2 rounded">{error}</div>}  
        {success && <div className="text-green-500 mb-5 bg-green-100 p-2 rounded">{success}</div>}  

        <button  
          type="submit"  
          className="bg-blue-600 text-white rounded w-full py-3 hover:bg-blue-700 transition duration-150"  
        >  
          {step === 'request' ? '發送驗證碼' : '重置密碼'}  
        </button>  

        <div className="mt-4 text-center">  
          <Link href="/auth/login">  
            <span className="text-blue-500 hover:underline">返回登入</span>  
          </Link>  
        </div>  
      </form>  
    </div>  
  );  
};  

export default ForgotPasswordPage;