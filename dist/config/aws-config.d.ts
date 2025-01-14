import AWS from 'aws-sdk';
export declare function configureAWS(): Promise<boolean>;
export declare function initializeAWSServices(): Promise<{
    s3: AWS.S3;
    dynamodb: AWS.DynamoDB.DocumentClient;
    ses: AWS.SES;
}>;
