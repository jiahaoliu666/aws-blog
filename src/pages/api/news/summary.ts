import { DynamoDBClient, GetItemCommand, GetItemCommandInput } from "@aws-sdk/client-dynamodb";  
import { NextApiRequest, NextApiResponse } from "next";  

// 創建一個新的 DynamoDB 客戶端，指定區域  
const dbClient = new DynamoDBClient({ region: "ap-northeast-1" });  

export default async function handler(req: NextApiRequest, res: NextApiResponse) {  
  const { article_id, title, language } = req.query;  

  // 記錄接收到的請求參數  
  console.log(  
    `Received request with article_id: ${article_id}, title: ${title}, language: ${language}`  
  );  

  // 檢查必要的參數是否存在  
  if (!article_id || !title) {  
    console.error("缺少必要的參數");  
    return res.status(400).json({ message: "缺少必要的參數" });  
  }  

  // 設置查詢 DynamoDB 的參數  
  const params: GetItemCommandInput = {  
    TableName: "AWS_Blog_News",  
    Key: {  
      article_id: { S: article_id as string },  
      title: { S: title as string },  
    },  
  };  

  try {  
    // 發送查詢命令以獲取指定文章的數據  
    const data = await dbClient.send(new GetItemCommand(params));  
    console.log("DynamoDB response:", data);  

    if (data.Item) {  
      const summary = data.Item.summary?.S;  
      // 如果摘要不存在，返回 404 錯誤  
      if (!summary) {  
        console.warn("Summary not found");  
        return res.status(404).json({ message: "Summary not found" });  
      }  

      // 返回狀態 200 並以 JSON 格式返回摘要  
      return res.status(200).json({ summary });  
    } else {  
      // 如果文章在資料庫中未找到，返回 404 錯誤  
      console.warn("Article not found in database");  
      return res.status(404).json({ message: "Article not found" });  
    }  
  } catch (error: any) {  
    // 如果從資料庫獲取摘要時出現錯誤，記錄錯誤並返回狀態 500  
    console.error("從資料庫獲取摘要時出現錯誤:", error);  
    return res  
      .status(500)  
      .json({ message: "Server error", error: error.message });  
  }  
}