// src/pages/api/news/getNewsSummary.js
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const dbClient = new DynamoDBClient({ region: "ap-northeast-1" });

export default async function handler(req, res) {
  const { article_id, title, language } = req.query;

  console.log(
    `Received request with article_id: ${article_id}, title: ${title}, language: ${language}`
  );

  if (!article_id || !title) {
    console.error("缺少必要的參數");
    return res.status(400).json({ message: "缺少必要的參數" });
  }

  const params = {
    TableName: "AWS_Blog_News",
    Key: {
      article_id: { S: article_id },
      title: { S: title },
    },
  };

  try {
    const data = await dbClient.send(new GetItemCommand(params));
    console.log("DynamoDB response:", data);

    if (data.Item) {
      const summary = data.Item.summary?.S;
      if (!summary) {
        console.warn("Summary not found");
        return res.status(404).json({ message: "Summary not found" });
      }

      return res.status(200).json({ summary });
    } else {
      console.warn("Article not found in database");
      return res.status(404).json({ message: "Article not found" });
    }
  } catch (error) {
    console.error("從資料庫獲取摘要時出現錯誤:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
}
