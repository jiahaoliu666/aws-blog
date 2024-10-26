// src/utils/cognitoClient.ts  
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";  
import dotenv from 'dotenv';

dotenv.config(); // 加載 .env 文件中的環境變量

console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID); // 僅用於開發調試
console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY); // 僅用於開發調試

const cognitoClient = new CognitoIdentityProviderClient({  
  region: "ap-northeast-1", // 確保這裡的區域是正確的
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '', // 確保這些環境變量已設置
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});  

export default cognitoClient;
