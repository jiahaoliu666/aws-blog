// src/utils/cognitoClient.ts  
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";  

const cognitoClient = new CognitoIdentityProviderClient({  
  region: "ap-northeast-1", // 確保這裡的區域是正確的
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '', // 確保這些環境變量已設置
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});  

export default cognitoClient;
