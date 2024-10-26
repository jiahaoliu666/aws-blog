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
  },
  // 如果需要其他配置，可以在這裡添加
};

export default nextConfig;
