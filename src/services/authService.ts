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
    this.userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '';
    this.clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '';
    
    if (!this.userPoolId || !this.clientId) {
      logger.error('Cognito 設定錯誤:', {
        hasUserPoolId: !!this.userPoolId,
        hasClientId: !!this.clientId
      });
      throw new Error('缺少必要的 Cognito 設定');
    }

    this.client = new CognitoIdentityProviderClient({
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-1'
    });

    logger.info('AuthService 初始化成功:', {
      hasUserPoolId: !!this.userPoolId,
      hasClientId: !!this.clientId,
      region: process.env.NEXT_PUBLIC_AWS_REGION
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

  async verifyPassword(userSub: string, password: string): Promise<boolean> {
    try {
      logger.info('開始驗證密碼');
      
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
      return true;
    } catch (error) {
      logger.error('驗證密碼失敗:', { userSub, error });
      if (error instanceof NotAuthorizedException) {
        throw new Error('密碼驗證失敗，請確認密碼是否正確');
      }
      if (error instanceof UserNotFoundException) {
        throw new Error('用戶不存在');
      }
      throw error;
    }
  }

  async deleteAccount(userSub: string, password: string): Promise<void> {
    try {
      // 1. 先驗證密碼
      const isPasswordValid = await this.verifyPassword(userSub, password);
      if (!isPasswordValid) {
        logger.warn('密碼驗證失敗，終止刪除流程');
        throw new Error('密碼錯誤');
      }

      // 2. 密碼驗證成功後，再執行刪除
      await this.deleteUserFromCognito(userSub);
      logger.info('用戶刪除成功');

    } catch (error) {
      logger.error('刪除帳號失敗:', { userSub, error });
      throw error;
    }
  }

  public async deleteCognitoUser(userSub: string): Promise<void> {
    return this.deleteUserFromCognito(userSub);
  }
  
  private async deleteUserFromCognito(userSub: string): Promise<void> {
    try {
      const command = new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: userSub
      });
      
      await this.client.send(command);
      logger.info('Cognito 用戶刪除成功');
    } catch (error) {
      logger.error('刪除 Cognito 用戶失敗:', error);
      throw error;
    }
  }

  async deleteUser(userSub: string, password: string): Promise<void> {
    try {
      logger.info('開始驗證密碼');
      
      // 1. 先驗證密碼
      await this.verifyPassword(userSub, password);
      logger.info('密碼驗證成功');
      
      // 2. 密碼驗證成功後，再刪除 Cognito 用戶
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

  async deleteUserWithoutPassword(userSub: string): Promise<void> {
    try {
      const command = new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: userSub
      });
      await this.client.send(command);
      logger.info('Cognito 用戶刪除成功');
    } catch (error) {
      logger.error('刪除 Cognito 用戶失敗:', error);
      throw error;
    }
  }

  async deleteUserWithPassword(userSub: string, password: string): Promise<void> {
    try {
      logger.info('開始刪除用戶流程', { userSub });
      
      // 1. 先驗證密碼
      const isPasswordValid = await this.verifyPassword(userSub, password);
      if (!isPasswordValid) {
        throw new Error('密碼錯誤');
      }
      
      // 2. 密碼驗證成功後，再刪除用戶
      await this.deleteUserFromCognito(userSub);
      logger.info('Cognito 用戶刪除成功');
      
    } catch (error) {
      logger.error('刪除用戶失敗:', { userSub, error });
      throw error;
    }
  }
}