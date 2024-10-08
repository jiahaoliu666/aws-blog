import { NextApiRequest, NextApiResponse } from 'next';  
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';  

const dbClient = new DynamoDBClient({ region: 'ap-northeast-1' });  

export default async function handler(req: NextApiRequest, res: NextApiResponse) {  
  const scanParams = {  
    TableName: 'AWS_Blog_News', // 使用你的 DynamoDB 表名稱  
  };  

  try {  
    const data = await dbClient.send(new ScanCommand(scanParams));  
    const articles = (data.Items || []).map(item => ({  
      article_id: item.article_id.S,  
      title: item.title.S,  
      published_at: item.published_at.N,  
      info: item.info.S,  
      description: item.description.S,  
      link: item.link.S,  
    }));  

    res.status(200).json(articles);  
  } catch (error) {  
    console.error('獲取文章時發生錯誤:', error);  
    res.status(500).json({ error: '無法獲取文章' });  
  }  
}