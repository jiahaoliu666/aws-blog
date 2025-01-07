// next.config.mjs
import dotenv from "dotenv";

// 加載 .env.local 文件中的環境變量
dotenv.config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        worker_threads: false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Amplify 特定配置
  images: {
    unoptimized: true,
    domains: [
      'aws-blog-avatar.s3.ap-northeast-1.amazonaws.com',
      'aws-blog-feedback.s3.ap-northeast-1.amazonaws.com'
    ]
  }
};

export default nextConfig;
