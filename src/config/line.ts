// config/line.ts
import { LineConfig } from '../types/lineTypes';

export const lineConfig: LineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  apiUrl: 'https://api.line.me/v2/bot',
  webhookUrl: process.env.NODE_ENV === 'development' 
    ? `${process.env.NGROK_URL || ''}/api/line/webhook`
    : `${process.env.NEXT_PUBLIC_API_URL || ''}/api/line/webhook`,
  basicId: process.env.NEXT_PUBLIC_LINE_BASIC_ID || '',
  qrCodeUrl: process.env.NEXT_PUBLIC_LINE_QR_CODE_URL || '',
  officialAccountName: process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_NAME || ''
};

// 添加環境變數檢查函數
const checkEnvVariables = () => {
  console.log('環境變數載入狀態：', {
    NODE_ENV: process.env.NODE_ENV,
    ENV_FILE_LOADED: process.env.NEXT_PUBLIC_ENV_LOADED || '未載入',
    LINE_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN ? '已設置' : '未設置',
    LINE_SECRET: process.env.LINE_CHANNEL_SECRET ? '已設置' : '未設置',
    TOKEN_LENGTH: process.env.LINE_CHANNEL_ACCESS_TOKEN?.length || 0,
    SECRET_LENGTH: process.env.LINE_CHANNEL_SECRET?.length || 0,
  });

  // 檢查環境變數格式
  if (process.env.LINE_CHANNEL_ACCESS_TOKEN?.includes('"') || 
      process.env.LINE_CHANNEL_SECRET?.includes('"')) {
    console.error('⚠️ 環境變數包含引號，請移除引號');
  }

  if (process.env.LINE_CHANNEL_ACCESS_TOKEN?.includes(' ') || 
      process.env.LINE_CHANNEL_SECRET?.includes(' ')) {
    console.error('⚠️ 環境變數包含空格，請移除空格');
  }
};

const validateLineConfig = () => {
  // 在驗證開始時檢查環境變數
  checkEnvVariables();

  try {
    const requiredVars = {
      LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN,
      LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET
    };
    
    const missingVars = Object.entries(requiredVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      const errorMessage = `缺少必要的 LINE 環境變數：${missingVars.join('、')}`;
      console.error(`❌ ${errorMessage}`);
      console.warn('請確認以下事項：');
      console.warn('1. .env.local 檔案是否存在於專案根目錄');
      console.warn('2. 環境變數是否正確設置（不要有引號或空格）');
      console.warn('3. 是否重新啟動了開發伺服器');
      return {
        isValid: false,
        missingVars
      };
    }

    console.log('✅ LINE 設定驗證成功');
    return {
      isValid: true,
      missingVars: []
    };
  } catch (error) {
    console.error('❌ LINE 設定驗證過程發生錯誤：', error);
    return {
      isValid: false,
      missingVars: [],
      error
    };
  }
};

export const lineConfigValidation = validateLineConfig();

// 導出驗證狀態供其他模組使用
export const isLineConfigValid = lineConfigValidation.isValid;

if (!isLineConfigValid) {
  console.warn('⚠️ LINE 設定驗證失敗，部分功能可能無法正常運作。請確認環境變數設定是否正確。');
}

export const LINE_MESSAGE_MAX_LENGTH = 2000;
export const LINE_RETRY_COUNT = 3;
export const LINE_RETRY_DELAY = 1000; // milliseconds