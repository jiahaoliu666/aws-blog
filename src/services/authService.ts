import { 
  CognitoIdentityProviderClient, 
  AdminInitiateAuthCommand,
  AdminDeleteUserCommand,
  AuthFlowType,
  AdminGetUserCommand,
  NotAuthorizedException,
  UserNotFoundException
} from "@aws-sdk/client-cognito-identity-provider";
import { logger } from '@/utils/logger';

export class AuthService {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;

  constructor() {
    this.userPoolId = process.env.COGNITO_USER_POOL_ID || '';
    this.clientId = process.env.COGNITO_CLIENT_ID || '';
    
    this.client = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });

    logger.info('AuthService 初始化:', {
      hasUserPoolId: !!this.userPoolId,
      hasClientId: !!this.clientId,
      region: process.env.AWS_REGION
    });
  }

  async verifyUserPassword(userId: string, password: string): Promise<void> {
    try {
      const command = new AdminInitiateAuthCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
        AuthParameters: {
          USERNAME: userId,
          PASSWORD: password,
        },
      });

      await this.client.send(command);
    } catch (error) {
      if (error instanceof NotAuthorizedException) {
        throw new Error('密碼錯誤');
      }
      throw error;
    }
  }

  async deleteUserFromCognito(userId: string): Promise<void> {
    try {
      logger.info('開始從 Cognito 刪除用戶:', { userId });
      
      const command = new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: userId
      });

      await this.client.send(command);
      logger.info('用戶從 Cognito 刪除成功:', { userId });
    } catch (error) {
      logger.error('從 Cognito 刪除用戶失敗:', { userId, error });
      throw error;
    }
  }
}