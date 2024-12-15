// pages/api/auth/cleanup.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { 
  CognitoIdentityProviderClient, 
  AdminDeleteUserCommand,
  AdminGetUserCommand
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只允許 POST 請求' });
  }

  const { email } = req.body;

  try {
    // 先檢查用戶是否存在且狀態為未驗證
    const getUserCommand = new AdminGetUserCommand({
      UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      Username: email
    });

    try {
      const userResponse = await cognitoClient.send(getUserCommand);
      
      // 檢查用戶狀態是否為未驗證
      if (userResponse.UserStatus !== 'UNCONFIRMED') {
        return res.status(400).json({
          message: '此用戶已驗證或狀態不符合清理條件',
          email
        });
      }

      // 如果用戶存在且未驗證,執行刪除操作
      const deleteUserCommand = new AdminDeleteUserCommand({
        UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
        Username: email
      });

      await cognitoClient.send(deleteUserCommand);

      return res.status(200).json({ 
        message: '成功清理未驗證用戶',
        email 
      });

    } catch (error: any) {
      if (error.name === 'UserNotFoundException') {
        return res.status(404).json({
          message: '用戶不存在',
          email
        });
      }
      throw error; // 其他錯誤往下傳遞
    }

  } catch (error: any) {
    return res.status(500).json({ 
      message: '清理用戶失敗',
      error: error.message
    });
  }
}