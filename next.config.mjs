// next.config.mjs
import dotenv from "dotenv";

// 加載環境變量
dotenv.config();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizeCss: true,
    legacyBrowsers: false,
    forceSwcTransforms: true,
  },
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
    // 優化構建
    config.optimization = {
      ...config.optimization,
      minimize: true,
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          default: false,
          vendors: false,
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all',
            name(module) {
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
              return `npm.${packageName.replace('@', '')}`;
            },
          },
        },
      },
    };
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
    CUSTOM_REGION: process.env.CUSTOM_REGION || 'ap-northeast-1',
    NEXT_PUBLIC_REGION: process.env.NEXT_PUBLIC_REGION || 'ap-northeast-1'
  }
};

export default nextConfig;
