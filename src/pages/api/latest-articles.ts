import { DynamoDB } from 'aws-sdk';
import { NextApiRequest, NextApiResponse } from 'next';

// 定義文章介面
interface Article {
  article_id: string;
  title: string;
  translated_title: string;
  created_at: number;
  type: string;
  link: string;
  summary: string;
  category?: string;
}

// 初始化 DynamoDB 客戶端
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

// 定義資料表名稱
const tables = [
  'AWS_Blog_Announcement',
  'AWS_Blog_Architecture',
  'AWS_Blog_Knowledge',
  'AWS_Blog_News',
  'AWS_Blog_Solutions'
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 從每個資料表獲取文章
    const articlesPromises = tables.map(async (tableName) => {
      const params = {
        TableName: tableName,
        ProjectionExpression: 'article_id, title, translated_title, created_at, #type, link, summary',
        ExpressionAttributeNames: {
          '#type': 'type'
        }
      };

      const result = await dynamoDB.scan(params).promise();
      return (result.Items || []).map((item: DynamoDB.DocumentClient.AttributeMap) => ({
        article_id: item.article_id as string,
        title: item.title as string,
        translated_title: item.translated_title as string,
        created_at: item.created_at as number,
        type: item.type as string,
        link: item.link as string,
        summary: item.summary as string,
        category: tableName.replace('AWS_Blog_', '').toLowerCase()
      }));
    });

    // 等待所有查詢完成
    const allArticles = await Promise.all(articlesPromises);
    
    // 合併所有文章並排序
    const sortedArticles = allArticles
      .flat()
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 20) // 只取前20筆
      .map(article => ({
        article_id: article.article_id,
        title: article.translated_title || article.title, // 優先使用翻譯後的標題
        date: article.created_at,
        category: article.category,
        link: article.link,
        summary: article.summary
      }));

    return res.status(200).json({ articles: sortedArticles });
  } catch (error) {
    console.error('Error fetching latest articles:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 