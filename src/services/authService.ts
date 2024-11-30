import { 
  CognitoIdentityProviderClient, 
  AdminInitiateAuthCommand,
  AdminDeleteUserCommand,
  InitiateAuthCommand,
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

  async validateAndDeleteUser(userSub: string, password: string): Promise<void> {
    try {
      logger.info('開始驗證密碼和刪除用戶:', { userSub });
      
      // 1. 驗證密碼
      await this.verifyPassword(userSub, password);
      logger.info('密碼驗證成功');
      
      // 2. 刪除 Cognito 用戶
      await this.deleteUserFromCognito(userSub);
      logger.info('Cognito 用戶刪除成功');
      
    } catch (error) {
      logger.error('驗證密碼或刪除用戶失敗:', { userSub, error });
      if (error instanceof NotAuthorizedException) {
        throw new Error('密碼錯誤');
      }
      if (error instanceof UserNotFoundException) {
        throw new Error('用戶不存在');
      }
      throw error;
    }
  }

  async verifyPassword(userSub: string, password: string): Promise<void> {
    try {
      const command = new AdminInitiateAuthCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
        AuthParameters: {
          USERNAME: userSub,
          PASSWORD: password
        }
      });
      
      await this.client.send(command);
      logger.info('密碼驗證成功');
    } catch (error) {
      logger.error('密碼驗證失敗:', error);
      if (error instanceof NotAuthorizedException) {
        throw new Error('密碼錯誤');
      }
      throw error;
    }
  }

  async deleteUserFromCognito(userSub: string): Promise<void> {
    try {
      const command = new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: userSub
      });
      
      await this.client.send(command);
      logger.info('Cognito 用戶刪除成功:', { userSub });
    } catch (error) {
      logger.error('刪除 Cognito 用戶失敗:', error);
      throw error;
    }
  }
}