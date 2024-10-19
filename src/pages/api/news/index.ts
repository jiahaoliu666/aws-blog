// src/pages/api/news/index.ts  
import { NextApiRequest, NextApiResponse } from 'next';  
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';  

// 創建一個新的 DynamoDB 客戶端，指定區域  
const dbClient = new DynamoDBClient({ region: 'ap-northeast-1' });  

export default async function handler(req: NextApiRequest, res: NextApiResponse) {  
  const { language = 'zh-TW' } = req.query;  // 默認語言設置為繁體中文  

  const scanParams = {  
    TableName: 'AWS_Blog_News', // 指定要掃描的 DynamoDB 表名稱  
  };  

  try {  
    // 發送掃描命令以獲取表中的數據  
    const data = await dbClient.send(new ScanCommand(scanParams));  
    // 將獲取的數據映射為文章列表  
    const articles = (data.Items || []).map(item => ({  
      article_id: item.article_id.S,  
      // 根據語言選擇標題  
      title: language === 'zh-TW' ? item.translated_title?.S || item.title.S : item.title.S,  
      published_at: item.published_at.N,  
      info: item.info.S,  
      // 根據語言選擇描述  
      description: language === 'zh-TW' ? item.translated_description?.S || item.description.S : item.description.S,  
      link: item.link.S,  
      summary: item.summary?.S,  // 確保包含摘要  
    }));  

    // 返回狀態 200 並以 JSON 格式返回文章數據  
    res.status(200).json(articles);  
  } catch (error) {  
    // 如果發生錯誤，記錄錯誤並返回狀態 500  
    console.error('獲取文章時發生錯誤:', error);  
    res.status(500).json({ error: '無法獲取文章' });  
  }  
}

