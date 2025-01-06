// next.config.mjs
import dotenv from "dotenv";

// 加載 .env.local 文件中的環境變量
dotenv.config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 添加允許其他主機訪問的配置
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  // 添加伺服器配置
  server: {
    port: 3000,
    host: '0.0.0.0', // 允許所有IP訪問
  },
  env: {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
    NEXT_PUBLIC_LINE_BASIC_ID: process.env.NEXT_PUBLIC_LINE_BASIC_ID,
    NEXT_PUBLIC_LINE_QR_CODE_URL: process.env.NEXT_PUBLIC_LINE_QR_CODE_URL,
    NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_NAME:
      process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_NAME,
  },
  // 改進環境變數檢查和日誌
  onDemandEntries: {
    webpack(config, { dev }) {
      if (dev) {
        const envStatus = {
          AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? "已設置" : "未設置",
          AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? "已設置" : "未設置",
          LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN ? "已設置" : "未設置",
          LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET ? "已設置" : "未設置",
        };
        console.log("環境變數載入狀態：", envStatus);
      }
      return config;
    },
  },
  // 添加公開運行時配置
  publicRuntimeConfig: {
    // 添加需要在客戶端使用的公開配置
    isProduction: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
