import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

export const dynamoClient = new DynamoDB({ 
  region: process.env.AWS_REGION || 'ap-northeast-1'
});

export const ddbDocClient = DynamoDBDocument.from(dynamoClient);

// 如果需要 JavaScript 版本的功能，可以在同一個檔案中導出
export const jsCompatible = {
  dynamoClient,
  ddbDocClient
}; 