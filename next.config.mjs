// next.config.mjs
import dotenv from "dotenv";

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizeCss: true,
    forceSwcTransforms: true,
  },
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json'
  },
  onDemandEntries: {
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
    config.optimization = {
      ...config.optimization,
      minimize: true,
    };
    return config;
  },
  images: {
    unoptimized: true,
    domains: [
      'aws-blog-avatar.s3.ap-northeast-1.amazonaws.com',
      'aws-blog-feedback.s3.ap-northeast-1.amazonaws.com'
    ]
  },
  env: {
    CUSTOM_REGION: process.env.CUSTOM_REGION || 'ap-northeast-1',
    NEXT_PUBLIC_REGION: process.env.NEXT_PUBLIC_REGION || 'ap-northeast-1'
  }
}

export default nextConfig;
