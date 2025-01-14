import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
// 檢查必要的環境變數
if (!process.env.NEXT_PUBLIC_AWS_REGION) {
    console.warn('警告: AWS_REGION 未設定，使用預設值 ap-northeast-1');
}
if (!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || !process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY) {
    console.warn('警告: AWS 認證資訊未完整設定');
}
// 建立基礎 DynamoDB 客戶端
export const ddbClient = new DynamoDBClient({
    region: process.env.NEXT_PUBLIC_AWS_REGION || "ap-northeast-1",
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || "",
    },
});
// 建立並導出 DynamoDB Document 客戶端
export const docClient = DynamoDBDocumentClient.from(ddbClient, {
    marshallOptions: {
        // 移除空字串、null 或未定義的屬性
        removeUndefinedValues: true,
        // 將空字串轉換為 null
        convertEmptyValues: true,
    },
});
//# sourceMappingURL=dynamodb.js.map