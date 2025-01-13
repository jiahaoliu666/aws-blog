import type { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDB } from 'aws-sdk';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { language } = req.query;

    // 檢查環境變數
    if (!process.env.DYNAMODB_ANNOUNCEMENT_TABLE) {
        console.error('環境變數錯誤: DYNAMODB_ANNOUNCEMENT_TABLE 未設置');
        return res.status(500).json({ 
            message: '伺服器配置錯誤',
            error: 'Missing DynamoDB table name configuration'
        });
    }

    if (!process.env.AWS_REGION) {
        console.error('環境變數錯誤: AWS_REGION 未設置');
        return res.status(500).json({ 
            message: '伺服器配置錯誤',
            error: 'Missing AWS region configuration'
        });
    }

    try {
        // 初始化 DynamoDB 客戶端
        const dynamodb = new DynamoDB.DocumentClient({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
            }
        });

        // 確保環境變數中的表名正確
        const TABLE_NAME = process.env.DYNAMODB_ANNOUNCEMENT_TABLE || 'AWS_Blog_Announcement';

        // 設置查詢參數
        const params = {
            TableName: process.env.DYNAMODB_ANNOUNCEMENT_TABLE,
            ProjectionExpression: "article_id, title, published_at, info, description, link, summary, createdAt, author, translated_title, translated_description"
        };

        // console.log('正在查詢 DynamoDB，參數:', {
        //     TableName: process.env.DYNAMODB_ANNOUNCEMENT_TABLE,
        //     Region: process.env.AWS_REGION
        // });

        // 執行查詢
        const result = await dynamodb.scan(params).promise();
        
        if (!result.Items) {
            console.warn('DynamoDB 查詢結果為空');
            return res.status(200).json([]);
        }

        // 修改語言過濾邏輯
        const filteredItems = result.Items;  

        // console.log(`成功過濾 ${language} 語言的公告，共 ${filteredItems.length} 筆`);
        res.status(200).json(filteredItems);

    } catch (error) {
        console.error('DynamoDB 錯誤:', error);
        
        // 更詳細的錯誤訊息
        const errorMessage = error instanceof Error ? error.message : '未知錯誤';
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        res.status(500).json({ 
            message: '資料庫查詢錯誤',
            error: errorMessage,
            stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
            details: {
                tableName: process.env.DYNAMODB_ANNOUNCEMENT_TABLE,
                region: process.env.AWS_REGION
            }
        });
    }
} 