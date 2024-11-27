import { CognitoIdentityProviderClient, AdminInitiateAuthCommand, AuthFlowType, AdminDeleteUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { logger } from '@/utils/logger';

export class AuthService {
  private client: CognitoIdentityProviderClient;

  constructor() {
    this.client = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
  }

  async validatePassword(userId: string, password: string): Promise<boolean> {
    try {
      console.log('驗證密碼:', { userId });

      const params = {
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        ClientId: process.env.COGNITO_CLIENT_ID,
        AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
        AuthParameters: {
          USERNAME: userId,
          PASSWORD: password
        }
      };

      const command = new AdminInitiateAuthCommand(params);
      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('密碼驗證失敗:', error);
      return false;
    }
  }

  async deleteUserFromCognito(userId: string): Promise<void> {
    try {
      const params = {
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: userId
      };

      const command = new AdminDeleteUserCommand(params);
      await this.client.send(command);
      logger.info('成功從 Cognito 刪除用戶', { userId });
    } catch (error) {
      logger.error('從 Cognito 刪除用戶失敗', { userId, error });
      throw error;
    }
  }
}