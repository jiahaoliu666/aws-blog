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

  async validateUserPassword(email: string, password: string): Promise<boolean> {
    try {
      logger.info('開始驗證用戶密碼:', { email });

      if (!this.userPoolId || !this.clientId) {
        logger.error('缺少必要的 Cognito 配置');
        throw new Error('系統配置錯誤');
      }

      const params = {
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password
        }
      };

      logger.info('發送 Cognito 驗證請求');
      const command = new AdminInitiateAuthCommand(params);
      const response = await this.client.send(command);
      
      const isValid = !!response.AuthenticationResult?.AccessToken;
      logger.info('密碼驗證結果:', { isValid });
      return isValid;

    } catch (error: any) {
      logger.error('密碼驗證失敗:', {
        errorName: error.name,
        errorMessage: error.message,
        email
      });

      if (error instanceof NotAuthorizedException) {
        return false;
      }
      throw error;
    }
  }

  async deleteUserFromCognito(email: string): Promise<void> {
    try {
      logger.info('開始從 Cognito 刪除用戶:', { email });

      if (!this.userPoolId) {
        logger.error('缺少 UserPoolId 配置');
        throw new Error('系統配置錯誤');
      }

      // 先檢查用戶是否存在
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: email
      });

      try {
        await this.client.send(getUserCommand);
      } catch (error) {
        if (error instanceof UserNotFoundException) {
          logger.error('用戶不存在:', { email });
          throw new Error('找不到指定的用戶');
        }
        throw error;
      }

      // 執行刪除操作
      const deleteCommand = new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: email
      });

      await this.client.send(deleteCommand);
      logger.info('用戶成功從 Cognito 刪除:', { email });

    } catch (error: any) {
      logger.error('從 Cognito 刪除用戶失敗:', {
        errorName: error.name,
        errorMessage: error.message,
        email,
        stack: error.stack
      });
      throw error;
    }
  }
}