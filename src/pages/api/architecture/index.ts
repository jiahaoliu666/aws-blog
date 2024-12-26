import { NextApiRequest, NextApiResponse } from 'next';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

const dbClient = new DynamoDBClient({ 
    region: process.env.AWS_REGION || 'ap-northeast-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { language = 'zh-TW' } = req.query;

    const scanParams = {
        TableName: process.env.DYNAMODB_ARCHITECTURE_TABLE || 'AWS_Blog_Architecture',
        ProjectionExpression: "article_id, title, created_at, description, link, summary, translated_title, translated_description"
    };

    try {
        console.log('開始查詢 Architecture 表:', scanParams);
        const data = await dbClient.send(new ScanCommand(scanParams));
        
        if (!data.Items || data.Items.length === 0) {
            console.log('未找到架構參考數據');
            return res.status(200).json([]);
        }

        console.log('DynamoDB 原始數據:', JSON.stringify(data.Items, null, 2));

        const architectures = data.Items.map(item => ({
            article_id: item.article_id?.S,
            title: language === 'zh-TW' 
                ? (item.translated_title?.S || item.title?.S) 
                : item.title?.S,
            published_at: item.created_at?.S,
            description: language === 'zh-TW'
                ? (item.translated_description?.S || item.description?.S)
                : item.description?.S,
            link: item.link?.S,
            summary: item.summary?.S,
        }));

        console.log('處理後的架構參考數據:', JSON.stringify(architectures, null, 2));
        res.status(200).json(architectures);
    } catch (error) {
        console.error('獲取架構參考時發生錯誤:', error);
        res.status(500).json({ 
            error: '無法獲取架構參考',
            details: error instanceof Error ? error.message : '未知錯誤'
        });
    }
} 