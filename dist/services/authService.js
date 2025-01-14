import { CognitoIdentityProviderClient, AdminInitiateAuthCommand, AdminDeleteUserCommand, InitiateAuthCommand, AuthFlowType, NotAuthorizedException, UserNotFoundException, InvalidParameterException, AdminListDevicesCommand, AdminForgetDeviceCommand, AdminUserGlobalSignOutCommand } from "@aws-sdk/client-cognito-identity-provider";
import { logger } from '../utils/logger';
export class AuthService {
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
            region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-northeast-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
            }
        });
        logger.info('AuthService 初始化成功:', {
            hasUserPoolId: !!this.userPoolId,
            hasClientId: !!this.clientId,
            region: process.env.NEXT_PUBLIC_AWS_REGION
        });
    }
    async verifyUserPassword(userId, password) {
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
        }
        catch (error) {
            if (error instanceof NotAuthorizedException) {
                throw new Error('密碼錯誤');
            }
            throw error;
        }
    }
    async validateAndDeleteUser(userSub, password) {
        try {
            logger.info('開始驗證密碼和刪除用戶:', { userSub });
            // 1. 驗證密碼
            await this.verifyPassword(userSub, password);
            logger.info('密碼驗證成功');
            // 2. 刪除 Cognito 用戶
            await this.deleteUserFromCognito(userSub);
            logger.info('Cognito 用戶刪除成功');
        }
        catch (error) {
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
    async verifyPassword(userSub, password) {
        try {
            logger.info('開始密碼驗證流程', {
                userSub,
                timestamp: new Date().toISOString()
            });
            const command = new InitiateAuthCommand({
                ClientId: this.clientId,
                AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
                AuthParameters: {
                    USERNAME: userSub,
                    PASSWORD: password
                }
            });
            await this.client.send(command);
            logger.info('密碼驗證成功');
            return true;
        }
        catch (error) {
            logger.error('密碼驗證失敗:', {
                userSub,
                error: error instanceof Error ? error.message : '未知錯誤',
                stack: error instanceof Error ? error.stack : undefined
            });
            if (error instanceof UserNotFoundException) {
                throw new Error('Cognito 用戶不存在');
            }
            if (error instanceof NotAuthorizedException) {
                throw new Error('密碼錯誤');
            }
            throw error;
        }
    }
    async deleteAccount(userSub, password) {
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
        }
        catch (error) {
            logger.error('刪除帳號失敗:', { userSub, error });
            throw error;
        }
    }
    async deleteCognitoUser(userSub) {
        return this.deleteUserFromCognito(userSub);
    }
    async deleteUserFromCognito(userSub) {
        try {
            logger.info('開始刪除 Cognito 用戶流程', {
                userSub,
                timestamp: new Date().toISOString()
            });
            // 1. 先執行全域登出，確保所有裝置的 token 失效
            try {
                const signOutCommand = new AdminUserGlobalSignOutCommand({
                    UserPoolId: this.userPoolId,
                    Username: userSub
                });
                await this.client.send(signOutCommand);
                logger.info('用戶全域登出成功', { userSub });
            }
            catch (error) {
                logger.warn('全域登出時發生錯誤，繼續執行其他步驟:', error);
            }
            // 2. 列出並清除所有裝置
            try {
                const listDevicesCommand = new AdminListDevicesCommand({
                    UserPoolId: this.userPoolId,
                    Username: userSub,
                    Limit: 60 // 設定較大的限制以確保獲取所有裝置
                });
                const devicesResponse = await this.client.send(listDevicesCommand);
                if (devicesResponse.Devices && devicesResponse.Devices.length > 0) {
                    logger.info(`發現 ${devicesResponse.Devices.length} 個裝置需要清除`);
                    // 使用 Promise.allSettled 確保即使部分裝置清除失敗也不會影響整體流程
                    const forgetResults = await Promise.allSettled(devicesResponse.Devices.map(async (device) => {
                        if (device.DeviceKey) {
                            const forgetDeviceCommand = new AdminForgetDeviceCommand({
                                UserPoolId: this.userPoolId,
                                Username: userSub,
                                DeviceKey: device.DeviceKey
                            });
                            return this.client.send(forgetDeviceCommand);
                        }
                    }));
                    // 記錄裝置清除結果
                    const successCount = forgetResults.filter(result => result.status === 'fulfilled').length;
                    const failureCount = forgetResults.filter(result => result.status === 'rejected').length;
                    logger.info('裝置清除完成', {
                        totalDevices: devicesResponse.Devices.length,
                        successCount,
                        failureCount
                    });
                }
            }
            catch (error) {
                logger.warn('清除裝置時發生錯誤，繼續執行刪除用戶:', error);
            }
            // 3. 最後刪除用戶
            try {
                const deleteCommand = new AdminDeleteUserCommand({
                    UserPoolId: this.userPoolId,
                    Username: userSub
                });
                await this.client.send(deleteCommand);
                logger.info('Cognito 用戶刪除成功', { userSub });
            }
            catch (error) {
                logger.error('刪除用戶時發生錯誤:', error);
                throw error; // 這個錯誤需要拋出，因為這是關鍵步驟
            }
        }
        catch (error) {
            logger.error('刪除 Cognito 用戶過程中發生錯誤', {
                userSub,
                error: error instanceof Error ? error.message : '未知錯誤',
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }
    async deleteUser(userSub, password) {
        try {
            logger.info('開始刪除用戶流程', { userSub });
            // 1. 先驗證密碼
            await this.verifyPassword(userSub, password);
            logger.info('密碼驗證成功');
            // 2. 刪除 Cognito 用戶
            const command = new AdminDeleteUserCommand({
                UserPoolId: this.userPoolId,
                Username: userSub
            });
            await this.client.send(command);
            logger.info('Cognito 用戶刪除成功', { userSub });
        }
        catch (error) {
            logger.error('刪除用戶失敗:', { userSub, error });
            if (error instanceof NotAuthorizedException) {
                throw new Error('密碼錯誤');
            }
            if (error instanceof UserNotFoundException) {
                throw new Error('用戶不存在');
            }
            throw error;
        }
    }
    async deleteUserWithoutPassword(userSub) {
        try {
            const command = new AdminDeleteUserCommand({
                UserPoolId: this.userPoolId,
                Username: userSub
            });
            await this.client.send(command);
            logger.info('Cognito 用戶刪除成功');
        }
        catch (error) {
            logger.error('刪除 Cognito 用戶失敗:', error);
            throw error;
        }
    }
    handleAuthError(error) {
        if (error instanceof NotAuthorizedException) {
            throw new Error('密碼錯誤');
        }
        if (error instanceof InvalidParameterException) {
            logger.error('認證流程設定錯誤:', error);
            throw new Error('系統認證設定錯誤，請聯繫管理員');
        }
        if (error instanceof Error) {
            throw new Error(`認證失敗: ${error.message}`);
        }
        throw new Error('認證過程發生未知錯誤');
    }
}
//# sourceMappingURL=authService.js.map