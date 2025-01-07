// next.config.mjs
import dotenv from "dotenv";

// 加載環境變量
dotenv.config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 允許在缺少某些環境變量的情況下繼續構建
  onDemandEntries: {
    // 構建時的配置
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 2,
  },
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
  },
  // 環境變量配置
  env: {
    AWS_REGION: process.env.AWS_REGION || 'ap-northeast-1',
    NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-1'
  }
};

export default nextConfig;
