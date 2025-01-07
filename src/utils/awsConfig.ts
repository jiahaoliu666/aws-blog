import { SecretsManager } from 'aws-sdk';
import { fromIni } from '@aws-sdk/credential-providers';

let cachedCredentials: any = null;

export async function getAWSCredentials() {
    if (cachedCredentials) {
        return cachedCredentials;
    }

    try {
        // 檢查是否在 Amplify 環境中
        const isAmplifyEnv = process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI;
        
        // 在 Amplify 環境中，使用容器憑證
        if (isAmplifyEnv) {
            console.log('Running in Amplify environment, using container credentials');
            return {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                sessionToken: process.env.AWS_SESSION_TOKEN
            };
        }

        // 在生產環境中使用環境變量
        if (process.env.NODE_ENV === 'production' && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
            console.log('Using AWS credentials from environment variables');
            return {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                sessionToken: process.env.AWS_SESSION_TOKEN
            };
        }

        // 在本地開發時使用本地憑證
        if (process.env.NODE_ENV === 'development') {
            console.log('Using local AWS credentials from AWS CLI');
            return fromIni();
        }

        throw new Error('No valid AWS credentials found');
    } catch (error: any) {
        console.error('Error in getAWSCredentials:', error);
        throw new Error(`無法獲取 AWS 憑證: ${error.message}`);
    }
} 