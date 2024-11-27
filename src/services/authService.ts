import { CognitoIdentityProviderClient, AdminInitiateAuthCommand, AuthFlowType } from "@aws-sdk/client-cognito-identity-provider";
import { logger } from '@/utils/logger';

export class AuthService {
  private client: CognitoIdentityProviderClient;

  constructor() {
    this.client = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION
    });
  }

  async validatePassword(userId: string, password: string): Promise<boolean> {
    try {
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
      logger.error('密碼驗證失敗', { userId, error });
      return false;
    }
  }
}