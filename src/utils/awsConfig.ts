import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { SecretsManager } from 'aws-sdk';

let cachedCredentials: any = null;

export async function getAWSCredentials() {
    if (cachedCredentials) {
        return cachedCredentials;
    }

    try {
        // 在本地開發時使用本地憑證
        if (process.env.NODE_ENV === 'development') {
            console.log('Using local AWS credentials from AWS CLI');
            return fromNodeProviderChain();
        }

        // 在 EC2 環境中，自動使用 IAM Role 提供的臨時憑證
        console.log('Using EC2 IAM Role credentials');
        return fromNodeProviderChain();

    } catch (error: any) {
        console.error('Error in getAWSCredentials:', error);
        throw new Error(`無法獲取 AWS 憑證: ${error.message}`);
    }
} 