// next.config.mjs
import dotenv from "dotenv";

dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    forceSwcTransforms: true,
  },
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: "./tsconfig.json",
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
        dns: false,
        child_process: false
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
      "aws-blog-avatar.s3.ap-northeast-1.amazonaws.com",
      "aws-blog-feedback.s3.ap-northeast-1.amazonaws.com",
    ],
  },
  env: {
    AWS_REGION: process.env.AWS_REGION || "ap-northeast-1",
    NEXT_PUBLIC_AWS_REGION:
      process.env.NEXT_PUBLIC_AWS_REGION || "ap-northeast-1",
    USER_UPLOADS_BUCKET: process.env.USER_UPLOADS_BUCKET,
    AWS_BLOG_FEEDBACK_BUCKET: process.env.AWS_BLOG_FEEDBACK_BUCKET,
    DYNAMODB_ANNOUNCEMENT_TABLE: process.env.DYNAMODB_ANNOUNCEMENT_TABLE,
    DYNAMODB_SOLUTIONS_TABLE: process.env.DYNAMODB_SOLUTIONS_TABLE,
    DYNAMODB_ARCHITECTURE_TABLE: process.env.DYNAMODB_ARCHITECTURE_TABLE,
    DYNAMODB_NEWS_TABLE: process.env.DYNAMODB_NEWS_TABLE,
    DYNAMODB_KNOWLEDGE_TABLE: process.env.DYNAMODB_KNOWLEDGE_TABLE,
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_PASS: process.env.GMAIL_PASS,
    SES_SENDER_EMAIL: process.env.SES_SENDER_EMAIL,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID,
    DISCORD_NOTIFICATION_CHANNEL_ID:
      process.env.DISCORD_NOTIFICATION_CHANNEL_ID,
    DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI,
    DISCORD_AUTHORIZE_URL: process.env.DISCORD_AUTHORIZE_URL,
  },
  publicRuntimeConfig: {
    NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    NEXT_PUBLIC_COGNITO_USER_POOL_ID:
      process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    NEXT_PUBLIC_LINE_BASIC_ID: process.env.NEXT_PUBLIC_LINE_BASIC_ID,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_NAME:
      process.env.NEXT_PUBLIC_LINE_OFFICIAL_ACCOUNT_NAME,
    NEXT_PUBLIC_LINE_QR_CODE_URL: process.env.NEXT_PUBLIC_LINE_QR_CODE_URL,
    NEXT_PUBLIC_SES_SENDER_EMAIL: process.env.NEXT_PUBLIC_SES_SENDER_EMAIL,
  },
};

export default nextConfig;
