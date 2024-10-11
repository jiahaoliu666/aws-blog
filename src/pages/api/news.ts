// src/pages/api/news/news.ts
import { NextApiRequest, NextApiResponse } from 'next';  
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';  

const dbClient = new DynamoDBClient({ region: 'ap-northeast-1' });  

export default async function handler(req: NextApiRequest, res: NextApiResponse) {  
  const { language = 'zh-TW' } = req.query;  // 默認為繁體中文  

  const scanParams = {  
    TableName: 'AWS_Blog_News', // 使用你的 DynamoDB 表名稱  
  };  

  try {  
    const data = await dbClient.send(new ScanCommand(scanParams));  
    const articles = (data.Items || []).map(item => ({  
      article_id: item.article_id.S,  
      title: language === 'zh-TW' ? item.translated_title?.S || item.title.S : item.title.S,  
      published_at: item.published_at.N,  
      info: item.info.S,  
      description: language === 'zh-TW' ? item.translated_description?.S || item.description.S : item.description.S,  
      link: item.link.S,  
      summary: item.summary?.S,  // 確保包含摘要  
    }));  

    res.status(200).json(articles);  
  } catch (error) {  
    console.error('獲取文章時發生錯誤:', error);  
    res.status(500).json({ error: '無法獲取文章' });  
  }  
}