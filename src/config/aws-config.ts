import AWS from 'aws-sdk';
import { getAWSCredentials } from '../utils/awsConfig';

const DEFAULT_REGION = 'ap-northeast-1';

export async function configureAWS() {
    try {
        const credentials = await getAWSCredentials();
        const region = process.env.CUSTOM_REGION || process.env.NEXT_PUBLIC_REGION || DEFAULT_REGION;
        
        if (!process.env.CUSTOM_REGION && !process.env.NEXT_PUBLIC_REGION) {
            console.warn(`Region not set in environment variables, using default: ${DEFAULT_REGION}`);
        }

        if (AWS && AWS.config) {
            AWS.config.update({
                region,
                credentials: credentials || undefined,
                maxRetries: 3,
                httpOptions: {
                    timeout: 5000,
                    connectTimeout: 5000
                }
            });
            console.log('AWS configuration completed successfully with region:', region);
            return true;
        } else {
            throw new Error('AWS SDK not properly initialized');
        }
    } catch (error) {
        console.error('Error configuring AWS:', error);
        console.log('Attempting to continue with default configuration...');
        
        if (AWS && AWS.config) {
            AWS.config.update({
                region: DEFAULT_REGION,
                maxRetries: 3,
                httpOptions: {
                    timeout: 5000,
                    connectTimeout: 5000
                }
            });
        }
        return false;
    }
}

export async function initializeAWSServices() {
    const isConfigured = await configureAWS();
    
    try {
        if (!AWS) {
            throw new Error('AWS SDK not available');
        }
        
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