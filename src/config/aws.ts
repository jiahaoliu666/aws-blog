import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import AmazonDaxClient from 'amazon-dax-client';

// 配置 DAX 客戶端
const daxClient = new AmazonDaxClient({
  endpoints: [process.env.DAX_ENDPOINT],
  region: process.env.AWS_REGION
});

// 使用 DAX 客戶端創建 DynamoDB 文檔客戶端
const ddbClient = DynamoDBDocument.from(new DynamoDB({ 
  region: process.env.AWS_REGION 
}));

export { ddbClient }; 