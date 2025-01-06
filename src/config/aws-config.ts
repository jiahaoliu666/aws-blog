import AWS from 'aws-sdk';
import { getAWSCredentials } from '../utils/awsConfig';

export async function configureAWS() {
    try {
        const credentials = await getAWSCredentials();
        
        AWS.config.update({
            region: process.env.AWS_REGION || 'ap-northeast-1',
            credentials,
        });
    } catch (error) {
        console.error('Error configuring AWS:', error);
        throw error;
    }
}

// 初始化各種 AWS 服務的函數
export async function initializeAWSServices() {
    await configureAWS();
    
    return {
        s3: new AWS.S3(),
        dynamodb: new AWS.DynamoDB.DocumentClient(),
        ses: new AWS.SES(),
        // 根據需要添加其他服務
    };
} 