// next.config.mjs
import dotenv from "dotenv";

// 加載 .env.local 文件中的環境變量
dotenv.config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  onDemandEntries: {
    webpack(config, { dev }) {
      if (dev) {
        console.log("環境變數載入狀態：", {
          LINE_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN
            ? "已設置"
            : "未設置",
          LINE_SECRET: process.env.LINE_CHANNEL_SECRET ? "已設置" : "未設置",
        });
      }
      return config;
    },
  },
};

export default nextConfig;
