// 新增此文件以集中管理郵件相關配置
export const emailConfig = {
  senderEmail: process.env.NEXT_PUBLIC_SES_SENDER_EMAIL,
  region: process.env.AWS_REGION || 'ap-northeast-1',
  smtp: {
    host: process.env.SMTP_HOST,
    port: 587, // SES SMTP 使用 587 端口
    secure: false, // 使用 STARTTLS
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD
    }
  },
  
  // 驗證配置
  validateConfig: () => {
    // 確保只在伺服器端執行驗證
    if (typeof window !== 'undefined') {
      return;
    }

    if (!process.env.NEXT_PUBLIC_SES_SENDER_EMAIL) {
      throw new Error('未設置發件人郵箱');
    }
    if (!process.env.SMTP_HOST || !process.env.SMTP_USERNAME || !process.env.SMTP_PASSWORD) {
      throw new Error('未設置 SMTP 憑證');
    }
  }
}; 

export const validateEmailConfig = () => {
  // 確保只在伺服器端執行驗證
  if (typeof window !== 'undefined') {
    return;
  }

  const requiredVars = [
    'NEXT_PUBLIC_SES_SENDER_EMAIL',
    'SMTP_HOST',
    'SMTP_USERNAME',
    'SMTP_PASSWORD'
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }
}; 