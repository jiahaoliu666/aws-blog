import AWS from 'aws-sdk';
import { getAWSCredentials } from '../utils/awsConfig';

export async function configureAWS() {
    try {
        const credentials = await getAWSCredentials();
        
        if (!process.env.AWS_REGION) {
            console.warn('AWS_REGION not set, defaulting to ap-northeast-1');
        }
        
        AWS.config.update({
            region: process.env.AWS_REGION || 'ap-northeast-1',
            credentials,
            maxRetries: 3,
            httpOptions: {
                timeout: 5000,
                connectTimeout: 5000
            }
        });
        
        console.log('AWS configuration completed successfully');
    } catch (error) {
        console.error('Error configuring AWS:', error);
        throw error;
    }
}

// 初始化各種 AWS 服務的函數
export async function initializeAWSServices() {
    await configureAWS();
    
    try {
        const services = {
            s3: new AWS.S3(),
            dynamodb: new AWS.DynamoDB.DocumentClient(),
            ses: new AWS.SES(),
        };
        
        console.log('AWS services initialized successfully');
        return services;
    } catch (error) {
        console.error('Error initializing AWS services:', error);
        throw error;
    }
} 