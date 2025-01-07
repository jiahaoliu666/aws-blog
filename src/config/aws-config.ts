import AWS from 'aws-sdk';
import { getAWSCredentials } from '../utils/awsConfig';

const DEFAULT_REGION = 'ap-northeast-1';

export async function configureAWS() {
    try {
        const credentials = await getAWSCredentials();
        
        const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || DEFAULT_REGION;
        
        if (!process.env.AWS_REGION && !process.env.NEXT_PUBLIC_AWS_REGION) {
            console.warn(`AWS Region not set in environment variables, using default: ${DEFAULT_REGION}`);
        }
        
        AWS.config.update({
            region,
            credentials,
            maxRetries: 3,
            httpOptions: {
                timeout: 5000,
                connectTimeout: 5000
            }
        });
        
        console.log('AWS configuration completed successfully with region:', region);
        return true;
    } catch (error) {
        console.error('Error configuring AWS:', error);
        console.log('Attempting to continue with default configuration...');
        AWS.config.update({
            region: DEFAULT_REGION,
            maxRetries: 3,
            httpOptions: {
                timeout: 5000,
                connectTimeout: 5000
            }
        });
        return false;
    }
}

export async function initializeAWSServices() {
    const isConfigured = await configureAWS();
    
    try {
        const services = {
            s3: new AWS.S3(),
            dynamodb: new AWS.DynamoDB.DocumentClient(),
            ses: new AWS.SES(),
        };
        
        console.log(`AWS services initialized successfully${!isConfigured ? ' with default configuration' : ''}`);
        return services;
    } catch (error) {
        console.error('Error initializing AWS services:', error);
        throw new Error('Failed to initialize AWS services. Please check your configuration.');
    }
} 