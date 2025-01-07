import { SecretsManager } from 'aws-sdk';
import { fromIni } from '@aws-sdk/credential-providers';

let cachedCredentials: any = null;

export async function getAWSCredentials() {
    if (cachedCredentials) {
        return cachedCredentials;
    }

    try {
        // 在本地開發時使用本地憑證
        if (process.env.NODE_ENV === 'development') {
            console.log('Using local AWS credentials from AWS CLI');
            return fromIni();
        }

        const secretsManager = new SecretsManager({
            region: process.env.AWS_REGION || 'ap-northeast-1',
        });

        const secretName = '/aws-blog/credentials';
        
        try {
            const response = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
            
            if (!response.SecretString) {
                throw new Error('Secret string is empty');
            }

            const secret = JSON.parse(response.SecretString);
            
            if (!secret.AWS_ACCESS_KEY_ID || !secret.AWS_SECRET_ACCESS_KEY) {
                throw new Error('Missing required credentials in secret');
            }

            cachedCredentials = {
                accessKeyId: secret.AWS_ACCESS_KEY_ID,
                secretAccessKey: secret.AWS_SECRET_ACCESS_KEY,
            };

            console.log('Successfully loaded AWS credentials from Secrets Manager');
            return cachedCredentials;
            
        } catch (secretError: any) {
            if (secretError.code === 'DecryptionFailureException') {
                throw new Error('無法解密 Secret 的值 - 請確認 KMS 權限');
            } else if (secretError.code === 'InternalServiceErrorException') {
                throw new Error('Secrets Manager 內部服務錯誤');
            } else if (secretError.code === 'InvalidParameterException') {
                throw new Error('無效的參數 - 請確認 Secret 名稱');
            } else if (secretError.code === 'InvalidRequestException') {
                throw new Error('無效的請求 - 請確認請求格式');
            } else if (secretError.code === 'ResourceNotFoundException') {
                throw new Error(`找不到指定的 Secret: ${secretName}`);
            } else {
                throw new Error(`獲取 Secret 時發生錯誤: ${secretError.message}`);
            }
        }
    } catch (error: any) {
        console.error('Error in getAWSCredentials:', error);
        throw new Error(`無法獲取 AWS 憑證: ${error.message}`);
    }
} 