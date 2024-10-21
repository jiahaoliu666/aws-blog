// src/pages/auth/register.tsx  
import React, { useState } from 'react';  
import { ConfirmSignUpCommand, ResendConfirmationCodeCommand } from "@aws-sdk/client-cognito-identity-provider";  
import cognitoClient from '@/utils/cognitoClient';  
import { PasswordField, Input } from '@aws-amplify/ui-react';  
import '@aws-amplify/ui-react/styles.css';  
import Link from 'next/link';  
import { useRouter } from 'next/router';  
import Navbar from '@/components/common/Navbar';  
import Footer from '@/components/common/Footer';  
import { useAuthContext } from '@/context/AuthContext';  

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

  const handleRegister = async (e: React.FormEvent) => {  
    e.preventDefault();  

    const invalidCharactersPattern = /[^a-zA-Z0-9\u4e00-\u9fff]/;  
    if (invalidCharactersPattern.test(username)) {  
      setError('用戶名僅允許英文、繁體、數字，不可包含特殊字符');  
      setSuccess(null);  
      return;  
    }  

    if (password !== confirmPassword) {  
      setError('密碼不匹配');  
      setSuccess(null);  
      return;  
    }  

    try {  
      const success = await registerUser(email, password, username);  
      if (success) {  
        setSuccess('註冊成功！請檢查您的電子郵件以驗證您的帳戶。');  
        setError(null);  
        setIsVerificationNeeded(true);  
      }  
    } catch (err: any) {  
      // 處理錯誤
    }  
  };  

  const handleVerifyCode = async (e: React.FormEvent) => {  
    e.preventDefault();  
    try {  
      const command = new ConfirmSignUpCommand({  
        ClientId: "5ua9kmb59lmqks0echkc261dgh",  
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
        ClientId: "5ua9kmb59lmqks0echkc261dgh",  
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

  return (  
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-100 to-gray-300">  
      <Navbar />  
      <div className="flex items-center justify-center flex-grow px-4 py-8">  
        <form className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200" onSubmit={isVerificationNeeded ? handleVerifyCode : handleRegister} style={{ backdropFilter: 'blur(15px)', backgroundColor: 'rgba(255, 255, 255, 0.85)' }}>  
          <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800">註冊</h2>  

          <div className="mb-4">  
            <label htmlFor="username" className="text-base text-gray-700">用戶名</label>  
            <Input  
              id="username"  
              name="username"  
              type="text"  
              placeholder="輸入用戶名"  
              value={username}  
              onChange={(e) => setLocalUsername(e.target.value)}  
              required  
              className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"  
              disabled={isVerificationNeeded}  
              style={{ marginTop: '8px' }}  
            />  
          </div>  

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
              className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"  
              disabled={isVerificationNeeded}  
              style={{ marginTop: '8px' }}  
            />  
          </div>  

          {!isVerificationNeeded && (  
            <>  
              <div className="mb-4">  
                <PasswordField  
                  label="密碼"  
                  value={password}  
                  onChange={(e) => setPassword(e.target.value)}  
                  placeholder="輸入密碼"  
                  required  
                  className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"  
                />  
              </div>  

              <div className="mb-6">  
                <PasswordField  
                  label="確認密碼"  
                  value={confirmPassword}  
                  onChange={(e) => setConfirmPassword(e.target.value)}  
                  placeholder="再次輸入密碼"  
                  required  
                  className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"  
                />  
              </div>  
            </>  
          )}  

          {isVerificationNeeded && (  
            <>  
              <div className="mb-4">  
                <label htmlFor="verificationCode" className="text-base text-gray-700">驗證碼</label>  
                <Input  
                  id="verificationCode"  
                  name="verificationCode"  
                  type="text"  
                  placeholder="輸入驗證碼"  
                  value={verificationCode}  
                  onChange={(e) => setVerificationCode(e.target.value)}  
                  required  
                  className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"  
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

          {error && <div className="text-red-500 mb-5 bg-red-100 p-2 rounded">{error}</div>}  
          {success && <div className="text-green-500 mb-5 bg-green-100 p-2 rounded">{success}</div>}  

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
      </div>  
      <Footer />  
    </div>  
  );  
};  

export default RegisterPage;
