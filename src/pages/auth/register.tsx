// src/pages/auth/register.tsx  
import React, { useState } from 'react';  
import { ConfirmSignUpCommand, ResendConfirmationCodeCommand } from "@aws-sdk/client-cognito-identity-provider";  
import cognitoClient from '@/utils/cognitoClient';  
import { PasswordField, Input } from '@aws-amplify/ui-react';  
import '@aws-amplify/ui-react/styles.css';  
import Link from 'next/link';  
import { useRouter } from 'next/router';  
import Navbar from '@/components/common/Navbar';  
import Footer from '@/components/common/Footer';  // 導入 Footer
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
      if (err.message.includes('Username should be an email')) {  
        setError('用戶名必須是有效的電子郵件地址');  
      } else if (err.message.includes('User already exists')) {  
        setError('用戶已存在，請嘗試其他電子郵件');  
      } else if (err.message.includes('Password did not conform with policy')) {  
        setError(`密碼必須符合以下要求：  
        - 至少包含 1 個數字  
        - 至少包含 1 個特殊字元  
        - 至少包含 1 個大寫字母  
        - 至少包含 1 個小寫字母`);  
      } else {  
        setError(err.message || '註冊失敗');  
      }  
      setSuccess(null);  
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
    <>  
      <Navbar />  
      <div className="flex items-center justify-center min-h-screen bg-gray-200">  
        <form className="bg-white p-10 rounded-lg shadow-lg w-96" onSubmit={isVerificationNeeded ? handleVerifyCode : handleRegister}>  
          <h2 className="text-3xl font-semibold mb-6 text-center text-gray-800">註冊</h2>  

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
              className="border border-gray-300 p-2 rounded"  
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
              className="border border-gray-300 p-2 rounded"  
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
                  className="border border-gray-300 p-2 rounded"  
                />  
              </div>  

              <div className="mb-6">  
                <PasswordField  
                  label="確認密碼"  
                  value={confirmPassword}  
                  onChange={(e) => setConfirmPassword(e.target.value)}  
                  placeholder="再次輸入密碼"  
                  required  
                  className="border border-gray-300 p-2 rounded"  
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
                  className="border border-gray-300 p-2 rounded"  
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

          {error && <div className="text-red-500 mb-5 bg-red-100 p-2 rounded whitespace-pre-line">{error}</div>}  
          {success && <div className="text-green-500 mb-5 bg-green-100 p-2 rounded">{success}</div>}  

          <button  
            type="submit"  
            className="bg-green-600 text-white rounded w-full py-3 hover:bg-green-700 transition duration-150"  
          >  
            {isVerificationNeeded ? '確認驗證' : '註冊'}  
          </button>  

          <div className="mt-4 text-center">  
            <span className="text-gray-700">已經有帳號了？</span>&nbsp;  
            <Link href="/auth/login" legacyBehavior>  
              <a className="text-blue-500 hover:underline">登入</a>  
            </Link>  
          </div>  
        </form>  
      </div>  
      <Footer />  {/* 添加 Footer */}
    </>  
  );  
};  

export default RegisterPage;