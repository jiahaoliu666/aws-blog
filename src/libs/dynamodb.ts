// src/libs/dynamodb.ts
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const region = process.env.AWS_REGION || 'ap-northeast-1'; 

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// 檢查是否有必要的憑證
if (!accessKeyId || !secretAccessKey) {
  throw new Error('AWS_ACCESS_KEY_ID 和 AWS_SECRET_ACCESS_KEY 必須在環境變量中設定');
}

// 創建 DynamoDB 客戶端
const client = new DynamoDB({
  region,
  credentials: {
    accessKeyId,       // 確保此值為非 undefined 的 string
    secretAccessKey,   // 確保此值為非 undefined 的 string
  },
});

// 創建 Document Client
const docClient = DynamoDBDocumentClient.from(client);

export default docClient;
